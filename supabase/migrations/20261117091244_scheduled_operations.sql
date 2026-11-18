create function private.run_housekeeping() returns void language plpgsql security definer set search_path='' as $$
declare cutoff timestamptz; p public.profiles; total int; day_key text:=to_char(now() at time zone 'Asia/Manila','YYYY-MM-DD'); expired_ids uuid[]; failed_reply private.contact_replies;
begin
 perform pg_advisory_xact_lock(17011702);
 if extract(hour from now() at time zone 'Asia/Manila')>=9 then
  select value::timestamptz into cutoff from private.runtime_config where key='last_contact_rollup';
  if cutoff is null or (cutoff at time zone 'Asia/Manila')::date<(now() at time zone 'Asia/Manila')::date then
   select count(*) into total from private.contact_messages where created_at>coalesce(cutoff,now()-interval '24 hours');
   if total>0 then
    for p in select * from public.profiles where role='admin' and deactivated_at is null loop
     perform private.notify(p.id,'contact_messages','contact-rollup:'||p.id||':'||day_key,null,null,jsonb_build_object('title',total||' new contact messages.','count',total));
    end loop;
   end if;
   insert into private.runtime_config(key,value) values('last_contact_rollup',now()::text) on conflict(key) do update set value=excluded.value;
  end if;
 end if;
 delete from public.notifications where created_at<now()-interval '90 days';
 select array_agg(r.delivery_id) into expired_ids from private.contact_replies r join private.contact_messages m on m.id=r.message_id where m.status='closed' and m.closed_at<now()-interval '12 months';
 delete from private.contact_messages where status='closed' and closed_at<now()-interval '12 months';
 delete from private.deliveries where id=any(coalesce(expired_ids,'{}'));
 delete from private.delivery_events where created_at<now()-interval '90 days';
 delete from private.deliveries where kind<>'contact_reply' and status in ('sent','delivered','failed','bounced') and updated_at<now()-interval '7 days';
 delete from public.audit_entries where created_at<now()-interval '24 months';
 delete from private.rate_limits where created_at<now()-interval '1 day';
 delete from private.email_change_authorizations where expires_at<now();
 delete from private.job_failures where created_at<now()-interval '90 days';
 for failed_reply in with exhausted as (
  update private.deliveries set status='failed',last_error='retry_limit',updated_at=now()
  where (status='queued' or status='sending' and claimed_at<now()-interval '5 minutes') and (attempts>=5 or created_at<now()-interval '23 hours') returning id
 ) update private.contact_replies set delivery_status='failed' where delivery_id in(select id from exhausted) returning * loop
  update private.contact_messages set status='open',read_at=null,closed_at=null,closed_by=null,version=version+1 where id=failed_reply.message_id and last_reply_id=failed_reply.id;
  perform private.audit('messages','reply_failed',failed_reply.message_id::text);
 end loop;
end $$;
revoke all on function private.run_housekeeping() from public,anon,authenticated;
grant execute on function private.run_housekeeping() to service_role;
create function public.run_housekeeping() returns void language sql security invoker set search_path='' as $$select private.run_housekeeping()$$;
revoke all on function public.run_housekeeping() from public,anon,authenticated;
grant execute on function public.run_housekeeping() to service_role;

create function private.configure_worker(p_origin text,p_secret text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_origin!~'^https://[a-zA-Z0-9.-]+(:443)?$' or char_length(p_secret) not between 32 and 256 then raise exception 'Provide an HTTPS origin and a worker secret.' using errcode='23514';end if;
 insert into private.runtime_config(key,value) values('worker_url',p_origin||'/api/internal/deliveries'),('worker_secret',p_secret)
 on conflict(key) do update set value=excluded.value;
end $$;
revoke all on function private.configure_worker(text,text) from public,anon,authenticated;
grant execute on function private.configure_worker(text,text) to service_role;
create function public.configure_worker(p_origin text,p_secret text) returns void language sql security invoker set search_path='' as $$select private.configure_worker(p_origin,p_secret)$$;
revoke all on function public.configure_worker(text,text) from public,anon,authenticated;
grant execute on function public.configure_worker(text,text) to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create function private.dispatch_mail_worker() returns void language plpgsql security definer set search_path='' as $$
declare url_value text;secret_value text;
begin
 select value into url_value from private.runtime_config where key='worker_url';
 select value into secret_value from private.runtime_config where key='worker_secret';
 if url_value is null or secret_value is null then return;end if;
 perform net.http_post(url:=url_value,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret_value),body:='{}'::jsonb,timeout_milliseconds:=30000);
end $$;
revoke all on function private.dispatch_mail_worker() from public,anon,authenticated;
select cron.schedule('icg-publication','* * * * *','select private.run_editorial_jobs()');
select cron.schedule('icg-mail','* * * * *','select private.dispatch_mail_worker()');
select cron.schedule('icg-housekeeping','*/15 * * * *','select private.run_housekeeping()');

create function private.operations_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['admin']);
 return jsonb_build_object('worker_configured',exists(select 1 from private.runtime_config where key='worker_url'),
  'queued_deliveries',(select count(*) from private.deliveries where status in ('queued','sending')),
  'failed_deliveries',(select count(*) from private.deliveries where status in ('failed','bounced') and updated_at>now()-interval '7 days'),
  'recent_job_failures',(select count(*) from private.job_failures where created_at>now()-interval '1 day'));
end $$;
revoke all on function private.operations_status() from public,anon;
grant execute on function private.operations_status() to authenticated;
create function public.operations_status() returns jsonb language sql stable security invoker set search_path='' as $$select private.operations_status()$$;
grant execute on function public.operations_status() to authenticated;

create function private.queue_test_email() returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(array['admin']);address text;
begin
 perform private.consume_rate('test-email:'||actor,3,3600);
 select email into address from auth.users where id=actor;
 insert into private.deliveries(kind,recipient_id,to_email,payload,dedupe_key) values('test',actor,address,jsonb_build_object('title','Your ICG desk test email.'),'test:'||gen_random_uuid());
 perform private.audit('settings','test_email_queued',actor::text);
end $$;
revoke all on function private.queue_test_email() from public,anon;
grant execute on function private.queue_test_email() to authenticated;
create function public.queue_test_email() returns void language sql security invoker set search_path='' as $$select private.queue_test_email()$$;
grant execute on function public.queue_test_email() to authenticated;

create function private.log_audit_export(p_from timestamptz,p_to timestamptz,p_count int) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_actor(array['admin']);
 if p_to<=p_from or p_to-p_from>interval '366 days' or p_count not between 0 and 10000 then raise exception 'Narrow the export range.' using errcode='23514';end if;
 perform private.audit('security','audit_exported',null,null,jsonb_build_object('from',p_from,'to',p_to,'count',p_count));
end $$;
revoke all on function private.log_audit_export(timestamptz,timestamptz,int) from public,anon;
grant execute on function private.log_audit_export(timestamptz,timestamptz,int) to authenticated;
create function public.log_audit_export(p_from timestamptz,p_to timestamptz,p_count int) returns void language sql security invoker set search_path='' as $$select private.log_audit_export(p_from,p_to,p_count)$$;
grant execute on function public.log_audit_export(timestamptz,timestamptz,int) to authenticated;

create function private.save_tag(p_name text,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare name_value text:=lower(trim(p_name));
begin
 perform private.require_actor(array['admin']);
 if p_action='delete' and not exists(select 1 from private.article_revisions where name_value=any(tags)) then delete from private.tags where name=name_value;
 elsif p_action in ('archive','delete') then update private.tags set archived_at=now() where name=name_value;
 elsif p_action in ('save','restore') then insert into private.tags(name) values(name_value) on conflict(name) do update set archived_at=null;
 else raise exception 'Invalid tag action.' using errcode='23514';end if;
 perform private.audit('settings','tag_'||p_action,null,name_value);
end $$;
revoke all on function private.save_tag(text,text) from public,anon;
grant execute on function private.save_tag(text,text) to authenticated;
create function public.save_tag(p_name text,p_action text default 'save') returns void language sql security invoker set search_path='' as $$select private.save_tag(p_name,p_action)$$;
grant execute on function public.save_tag(text,text) to authenticated;

create function private.remove_avatar() returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor();
begin
 update public.profiles set avatar_path=null where id=actor;
 perform private.audit('people','avatar_removed',actor::text);
end $$;
revoke all on function private.remove_avatar() from public,anon;
grant execute on function private.remove_avatar() to authenticated;
create function public.remove_avatar() returns void language sql security invoker set search_path='' as $$select private.remove_avatar()$$;
grant execute on function public.remove_avatar() to authenticated;

notify pgrst,'reload schema';

create function public.calendar_counts(p_from date,p_to date,p_category text default null) returns table(day date,total bigint) language plpgsql stable security invoker set search_path='' as $$
begin
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>92 then raise exception 'Choose a calendar range up to 93 days.' using errcode='23514';end if;
 return query select d::date,count(a.id) from generate_series(p_from::timestamp,p_to::timestamp,interval '1 day') d
 left join public.public_articles a on a.type='event' and a.event_starts_at<((d+interval '1 day') at time zone 'Asia/Manila')
 and coalesce(a.event_ends_at,a.event_starts_at+interval '1 microsecond')>(d at time zone 'Asia/Manila')
 and (p_category is null or a.category_slug=p_category)
 group by d order by d;
end $$;
grant execute on function public.calendar_counts(date,date,text) to anon,authenticated;
