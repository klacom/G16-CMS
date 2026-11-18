-- Keep a bounded current health snapshot; failure history contains safe codes only.
create table private.job_status (
 job text primary key check(job in ('mail_dispatch','housekeeping')),
 request_id bigint,requested_at timestamptz,
 last_success_at timestamptz,last_failure_at timestamptz,last_failure_code text
);
insert into private.job_status(job) values('mail_dispatch'),('housekeeping');
alter table private.job_status enable row level security;
revoke all on private.job_status from public,anon,authenticated;
grant select on private.job_status to service_role;
create index job_failures_recent on private.job_failures(created_at desc);
create index job_failures_dedupe on private.job_failures(job,code,created_at desc);

create function private.record_job_failure(p_job text,p_code text) returns void language plpgsql security definer set search_path='' as $$
declare safe_code text:=case when p_code ~ '^[a-zA-Z0-9_]{1,64}$' then lower(p_code) else 'unknown' end;
begin
 update private.job_status set last_failure_at=clock_timestamp(),last_failure_code=safe_code where job=p_job;
 if not exists(select 1 from private.job_failures where job=p_job and code=safe_code and created_at>clock_timestamp()-interval '1 hour') then
  insert into private.job_failures(job,code) values(p_job,safe_code);
 end if;
end $$;
revoke all on function private.record_job_failure(text,text) from public,anon,authenticated;

create function private.reconcile_mail_worker() returns boolean language plpgsql security definer set search_path='' as $$
declare request private.job_status;response net._http_response;failure_code text;
begin
 select * into request from private.job_status where job='mail_dispatch' for update;
 if request.request_id is null then return true;end if;
 select * into response from net._http_response where id=request.request_id;
 if found then
  if coalesce(response.timed_out,false) then failure_code:='timed_out';
  elsif response.error_msg is not null then failure_code:='transport_error';
  elsif response.status_code between 200 and 299 then
   update private.job_status set request_id=null,requested_at=null,last_success_at=clock_timestamp() where job='mail_dispatch';
   return true;
  elsif response.status_code is not null then failure_code:='http_'||response.status_code;
  else failure_code:='invalid_response';end if;
 elsif request.requested_at>clock_timestamp()-interval '2 minutes' then return false;
 else failure_code:='missing_response';end if;
 perform private.record_job_failure('mail_dispatch',failure_code);
 update private.job_status set request_id=null,requested_at=null where job='mail_dispatch';
 return true;
end $$;
revoke all on function private.reconcile_mail_worker() from public,anon,authenticated;
grant execute on function private.reconcile_mail_worker() to service_role;
create function public.reconcile_mail_worker() returns boolean language sql security invoker set search_path='' as $$select private.reconcile_mail_worker()$$;
revoke all on function public.reconcile_mail_worker() from public,anon,authenticated;
grant execute on function public.reconcile_mail_worker() to service_role;

create or replace function private.dispatch_mail_worker() returns void language plpgsql security definer set search_path='' as $$
declare url_value text;secret_value text;queued_id bigint;
begin
 if not private.reconcile_mail_worker() then return;end if;
 select value into url_value from private.runtime_config where key='worker_url';
 select value into secret_value from private.runtime_config where key='worker_secret';
 if url_value is null or secret_value is null then return;end if;
 begin
  queued_id:=net.http_post(url:=url_value,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret_value),body:='{}'::jsonb,timeout_milliseconds:=65000);
  update private.job_status set request_id=queued_id,requested_at=clock_timestamp() where job='mail_dispatch';
 exception when others then
  perform private.record_job_failure('mail_dispatch',sqlstate);
 end;
end $$;
revoke all on function private.dispatch_mail_worker() from public,anon,authenticated;

create function private.run_housekeeping_job() returns void language plpgsql security definer set search_path='' as $$
begin
 -- The exception block rolls back incomplete maintenance before the safe failure
 -- record is appended. Do not rethrow and roll back that record with the job.
 begin
  perform private.run_housekeeping();
  update private.job_status set last_success_at=clock_timestamp() where job='housekeeping';
 exception when others then
  perform private.record_job_failure('housekeeping',sqlstate);
 end;
end $$;
revoke all on function private.run_housekeeping_job() from public,anon,authenticated;
grant execute on function private.run_housekeeping_job() to service_role;
create or replace function public.run_housekeeping() returns void language sql security invoker set search_path='' as $$select private.run_housekeeping_job()$$;
revoke all on function public.run_housekeeping() from public,anon,authenticated;
grant execute on function public.run_housekeeping() to service_role;
select cron.schedule('icg-housekeeping','*/15 * * * *','select private.run_housekeeping_job()');

create or replace function private.operations_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['admin']);
 return jsonb_build_object('worker_configured',exists(select 1 from private.runtime_config where key='worker_url'),
  'queued_deliveries',(select count(*) from private.deliveries where status in ('queued','sending')),
  'failed_deliveries',(select count(*) from private.deliveries where status in ('failed','bounced') and updated_at>now()-interval '7 days'),
  'recent_job_failures',(select count(*) from private.job_failures where created_at>now()-interval '1 day'),
  'worker_last_success_at',(select last_success_at from private.job_status where job='mail_dispatch'),
  'worker_last_failure_at',(select last_failure_at from private.job_status where job='mail_dispatch'),
  'worker_last_failure_code',(select last_failure_code from private.job_status where job='mail_dispatch'),
  'worker_pending_since',(select requested_at from private.job_status where job='mail_dispatch'),
  'housekeeping_last_success_at',(select last_success_at from private.job_status where job='housekeeping'),
  'housekeeping_last_failure_at',(select last_failure_at from private.job_status where job='housekeeping'),
  'housekeeping_last_failure_code',(select last_failure_code from private.job_status where job='housekeeping'));
end $$;

-- Serialize provider association with callbacks before either path locks a delivery.
create or replace function private.finish_delivery(p_id uuid,p_lease uuid,p_provider text,p_error text,p_retryable boolean) returns void language plpgsql security definer set search_path='' as $$
declare d private.deliveries; next_state text; reply private.contact_replies;
begin
 if p_provider is not null then perform pg_advisory_xact_lock(hashtextextended('icg:delivery:'||p_provider,0));end if;
 select * into d from private.deliveries where id=p_id for update;
 if d.status<>'sending' or d.lease_id is distinct from p_lease then return;end if;
 if p_provider is not null then next_state:='sent';
 elsif p_retryable and d.attempts<5 and d.created_at>now()-interval '22 hours' then next_state:='queued';
 else next_state:='failed';end if;
 update private.deliveries set status=next_state,provider_id=p_provider,last_error=case when p_provider is null then left(p_error,80) else null end,available_at=now()+make_interval(secs=>least(3600,(60*power(2,d.attempts))::int)),updated_at=now() where id=d.id;
 update private.contact_replies set delivery_status=next_state,sent_at=case when p_provider is not null then now() else sent_at end where delivery_id=d.id returning * into reply;
 if reply.id is not null then
  if next_state='sent' then update private.contact_messages set status='replied',version=version+1 where id=reply.message_id and last_reply_id=reply.id;
  elsif next_state='failed' then update private.contact_messages set status='open',read_at=null,version=version+1 where id=reply.message_id and last_reply_id=reply.id;end if;
  perform private.audit('messages','reply_'||next_state,reply.message_id::text);
 end if;
 if p_provider is not null then perform private.apply_delivery_events(d.id);end if;
end $$;

create or replace function private.record_delivery_event(p_id text,p_provider text,p_kind text,p_time timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare delivery uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('icg:delivery:'||p_provider,0));
 if char_length(p_id)>200 or char_length(p_provider)>100 or p_time>now()+interval '5 minutes' then raise exception 'Invalid delivery event.' using errcode='23514';end if;
 insert into private.delivery_events(id,provider_id,kind,occurred_at) values(p_id,p_provider,p_kind,p_time) on conflict(id) do nothing;
 if not found then return;end if;
 select id into delivery from private.deliveries where provider_id=p_provider;
 if delivery is not null then perform private.apply_delivery_events(delivery);end if;
end $$;

notify pgrst,'reload schema';
