create table private.runtime_config(key text primary key,value text not null);
alter table private.runtime_config enable row level security;
revoke all on private.runtime_config from public,anon,authenticated;
grant all on private.runtime_config to service_role;
insert into private.runtime_config(key,value) values('rate_salt',gen_random_uuid()::text);
create table private.rate_limits(key text not null,window_id bigint not null,hits int not null,created_at timestamptz not null default now(),primary key(key,window_id));
alter table private.rate_limits enable row level security;
revoke all on private.rate_limits from public,anon,authenticated;
create function private.consume_rate(p_key text,p_limit int,p_seconds int) returns void language plpgsql security definer set search_path='' as $$
declare hit_count int;
begin
 insert into private.rate_limits(key,window_id,hits) values(p_key,floor(extract(epoch from clock_timestamp())/p_seconds),1)
 on conflict(key,window_id) do update set hits=private.rate_limits.hits+1 returning hits into hit_count;
 if hit_count>p_limit then raise exception 'Please wait before sending another request.' using errcode='P0001'; end if;
end $$;
revoke all on function private.consume_rate(text,int,int) from public,anon,authenticated;

create table private.contact_messages (
 id uuid primary key default gen_random_uuid(),request_key uuid not null unique,payload_hash text not null,
 topic text not null check(topic in ('question','account','event','correction','photo','partner')),
 first_name text not null check(char_length(first_name) between 1 and 80),last_name text not null check(char_length(last_name) between 1 and 80),
 email text not null check(char_length(email)<=254),phone text check(char_length(phone)<=40),subject text not null check(char_length(subject) between 1 and 200),
 body text not null check(char_length(body) between 1 and 10000),article_id uuid references private.articles(id),event_title text,event_starts_at timestamptz,event_place text,
 status text not null default 'open' check(status in ('open','replied','closed')),version int not null default 1,
 created_at timestamptz not null default now(),read_at timestamptz,closed_at timestamptz,closed_by uuid references public.profiles(id),last_reply_id uuid
);
create index contact_status_date on private.contact_messages(status,created_at desc,id);
create table private.contact_replies (
 id uuid primary key default gen_random_uuid(),message_id uuid not null references private.contact_messages(id) on delete cascade,
 request_key uuid not null unique,sent_by uuid not null references public.profiles(id),body text not null check(char_length(body) between 1 and 10000),
 delivery_id uuid references private.deliveries(id),delivery_status text not null default 'queued' check(delivery_status in ('queued','sending','sent','delivered','failed','bounced','marked_only')),
 created_at timestamptz not null default now(),sent_at timestamptz
);
create index replies_message on private.contact_replies(message_id,created_at);
alter table private.contact_messages enable row level security;
alter table private.contact_replies enable row level security;
grant select on private.contact_messages,private.contact_replies to anon,authenticated;
grant all on private.contact_messages,private.contact_replies to service_role;
create policy contact_admin_read on private.contact_messages for select to authenticated using((select private.actor_role())='admin');
create policy reply_admin_read on private.contact_replies for select to authenticated using((select private.actor_role())='admin');
create view public.contact_messages with(security_invoker=true) as select id,topic,first_name,last_name,email,phone,subject,body,article_id,event_title,event_starts_at,event_place,status,version,created_at,read_at,closed_at,closed_by,last_reply_id from private.contact_messages;
create view public.contact_replies with(security_invoker=true) as select * from private.contact_replies;
grant select on public.contact_messages to anon,authenticated;
grant select on public.contact_replies to authenticated;

create function private.submit_contact(p_key uuid,p_data jsonb,p_honeypot text) returns uuid language plpgsql security definer set search_path='' as $$
declare message_id uuid; fingerprint text; previous_hash text; email_value text; salt text; ip text;
begin
 if coalesce(p_honeypot,'')<>'' then return gen_random_uuid(); end if;
 if p_key is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>20000 or exists(select 1 from jsonb_object_keys(p_data) k where k not in ('topic','first_name','last_name','email','phone','subject','body','article_id','event_title','event_starts_at','event_place')) then raise exception 'Invalid message.' using errcode='23514'; end if;
 fingerprint:=encode(extensions.digest(p_data::text,'sha256'),'hex');
 select id,payload_hash into message_id,previous_hash from private.contact_messages where request_key=p_key;
 if message_id is not null then
  if previous_hash<>fingerprint then raise exception 'Submission changed.' using errcode='40001'; end if;
  return message_id;
 end if;
 email_value:=lower(trim(p_data->>'email'));
 if email_value is null or email_value!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email.' using errcode='23514'; end if;
 if p_data->>'topic'='event' and (coalesce(trim(p_data->>'event_title'),'')='' or nullif(p_data->>'event_starts_at','') is null or coalesce(trim(p_data->>'event_place'),'')='') then raise exception 'Complete the event details.' using errcode='23514'; end if;
 if nullif(p_data->>'article_id','') is not null and not exists(select 1 from public.public_articles where id=(p_data->>'article_id')::uuid) then raise exception 'The referenced article is unavailable.' using errcode='23514'; end if;
 select value into salt from private.runtime_config where key='rate_salt';
 ip:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-forwarded-for','local');
 perform private.consume_rate('contact:global',60,600);
 perform private.consume_rate('contact:email:'||encode(extensions.digest(email_value||salt,'sha256'),'hex'),5,3600);
 perform private.consume_rate('contact:ip:'||encode(extensions.digest(ip||salt,'sha256'),'hex'),10,900);
 insert into private.contact_messages(request_key,payload_hash,topic,first_name,last_name,email,phone,subject,body,article_id,event_title,event_starts_at,event_place)
 values(p_key,fingerprint,p_data->>'topic',trim(p_data->>'first_name'),trim(p_data->>'last_name'),email_value,nullif(trim(p_data->>'phone'),''),trim(p_data->>'subject'),trim(p_data->>'body'),nullif(p_data->>'article_id','')::uuid,left(p_data->>'event_title',240),nullif(p_data->>'event_starts_at','')::timestamptz,left(p_data->>'event_place',240)) returning id into message_id;
 return message_id;
end $$;
revoke all on function private.submit_contact(uuid,jsonb,text) from public;
grant execute on function private.submit_contact(uuid,jsonb,text) to anon,authenticated;
create function public.submit_contact(p_key uuid,p_data jsonb,p_honeypot text default '') returns uuid language sql security invoker set search_path='' as $$select private.submit_contact(p_key,p_data,p_honeypot)$$;
grant execute on function public.submit_contact(uuid,jsonb,text) to anon,authenticated;

create function private.reply_contact(p_id uuid,p_version int,p_body text,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare m private.contact_messages; actor uuid; reply_id uuid; delivery uuid; previous private.contact_replies;
begin
 select * into m from private.contact_messages where id=p_id for update;
 actor:=private.require_actor(array['admin']);
 if m.id is null then raise exception 'Message unavailable.' using errcode='P0002'; end if;
 select * into previous from private.contact_replies where request_key=p_key;
 if previous.id is not null then
  if previous.message_id<>p_id or previous.sent_by<>actor or previous.body<>trim(p_body) then raise exception 'Reply changed.' using errcode='40001'; end if;
  return previous.id;
 end if;
 if m.version is distinct from p_version then raise exception 'Message changed.' using errcode='40001'; end if;
 if m.status='closed' or p_key is null or exists(select 1 from private.contact_replies where message_id=m.id and delivery_status in ('queued','sending')) then raise exception 'A reply is already pending, or the message is closed.' using errcode='23514'; end if;
 insert into private.contact_replies(message_id,request_key,sent_by,body) values(m.id,p_key,actor,trim(p_body)) returning id into reply_id;
 insert into private.deliveries(kind,recipient_id,to_email,payload,dedupe_key) values('contact_reply',actor,m.email,jsonb_build_object('reply_id',reply_id),'reply:'||reply_id) returning id into delivery;
 update private.contact_replies set delivery_id=delivery where id=reply_id;
 update private.contact_messages set version=version+1,last_reply_id=reply_id where id=m.id;
 perform private.audit('messages','reply_queued',m.id::text,m.subject,jsonb_build_object('reply_id',reply_id));
 return reply_id;
end $$;
revoke all on function private.reply_contact(uuid,int,text,uuid) from public,anon;
grant execute on function private.reply_contact(uuid,int,text,uuid) to authenticated;
create function public.reply_contact(p_id uuid,p_version int,p_body text,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.reply_contact(p_id,p_version,p_body,p_key)$$;
grant execute on function public.reply_contact(uuid,int,text,uuid) to authenticated;

create function private.manage_contact(p_id uuid,p_version int,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare m private.contact_messages; actor uuid;
begin
 select * into m from private.contact_messages where id=p_id for update;
 actor:=private.require_actor(array['admin']);
 if m.id is null then raise exception 'Message unavailable.' using errcode='P0002'; end if;
 if p_action='read' then update private.contact_messages set read_at=coalesce(read_at,now()) where id=p_id;return;end if;
 if m.version is distinct from p_version then raise exception 'Message changed.' using errcode='40001'; end if;
 if exists(select 1 from private.contact_replies where message_id=m.id and delivery_status in ('queued','sending')) then raise exception 'Wait for the pending reply to finish.' using errcode='23514'; end if;
 if p_action='delete' then
  update private.deliveries set payload='{}',to_email='',status='failed',last_error='message_deleted' where id in(select delivery_id from private.contact_replies where message_id=m.id);
  delete from private.contact_messages where id=m.id;
 elsif p_action='close' then update private.contact_messages set status='closed',closed_at=now(),closed_by=actor,version=version+1 where id=m.id;
 elsif p_action='reopen' then update private.contact_messages set status='open',closed_at=null,closed_by=null,version=version+1 where id=m.id;
 elsif p_action='mark_replied' then update private.contact_messages set status='replied',closed_at=null,closed_by=null,last_reply_id=null,version=version+1 where id=m.id;
 else raise exception 'Invalid message action.' using errcode='23514'; end if;
 perform private.audit('messages','message_'||p_action,m.id::text,m.subject);
end $$;
revoke all on function private.manage_contact(uuid,int,text) from public,anon;
grant execute on function private.manage_contact(uuid,int,text) to authenticated;
create function public.manage_contact(p_id uuid,p_version int,p_action text) returns void language sql security invoker set search_path='' as $$select private.manage_contact(p_id,p_version,p_action)$$;
grant execute on function public.manage_contact(uuid,int,text) to authenticated;

alter table private.deliveries add column last_event_at timestamptz not null default '-infinity';
alter table private.deliveries add column last_event_id text;
create table private.delivery_events(id text primary key,provider_id text not null,kind text not null check(kind in ('delivered','bounced','failed')),occurred_at timestamptz not null,created_at timestamptz not null default now());
create index delivery_events_provider on private.delivery_events(provider_id,occurred_at);
alter table private.delivery_events enable row level security;
revoke all on private.delivery_events from public,anon,authenticated;

create function private.apply_delivery_events(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare d private.deliveries; e private.delivery_events; reply private.contact_replies;
begin
 select * into d from private.deliveries where id=p_id for update;
 if d.provider_id is null then return;end if;
 select * into e from private.delivery_events where provider_id=d.provider_id order by occurred_at desc,case kind when 'bounced' then 3 when 'failed' then 2 else 1 end desc limit 1;
 if e.id is null or e.id=d.last_event_id or e.occurred_at<d.last_event_at then return;end if;
 update private.deliveries set last_event_id=e.id,last_event_at=e.occurred_at where id=d.id;
 if d.status=e.kind then return;end if;
 update private.deliveries set status=e.kind,updated_at=now() where id=d.id;
 update private.contact_replies set delivery_status=e.kind where delivery_id=d.id returning * into reply;
 if reply.id is not null and e.kind in ('bounced','failed') then
  update private.contact_messages set status='open',closed_at=null,closed_by=null,read_at=null,version=version+1 where id=reply.message_id and last_reply_id=reply.id;
  perform private.audit('messages','reply_'||e.kind,reply.message_id::text);
 end if;
end $$;
revoke all on function private.apply_delivery_events(uuid) from public,anon,authenticated;

create function public.claim_deliveries(p_limit int default 5) returns jsonb language plpgsql security invoker set search_path='' as $$
begin return private.claim_deliveries(p_limit);end $$;
-- Worker entry points are invoker wrappers; all privileged work remains private.
create function private.claim_deliveries(p_limit int) returns jsonb language plpgsql security definer set search_path='' as $$
declare d private.deliveries; result jsonb:='[]'; payload_value jsonb; reply private.contact_replies; m private.contact_messages;
begin
 for d in select * from private.deliveries where ((status='queued' and available_at<=now()) or (status='sending' and claimed_at<now()-interval '5 minutes')) and attempts<5 and created_at>now()-interval '23 hours' order by available_at,id for update skip locked limit greatest(1,least(coalesce(p_limit,5),10)) loop
  update private.deliveries set status='sending',attempts=attempts+1,claimed_at=now(),lease_id=gen_random_uuid(),updated_at=now() where id=d.id returning * into d;
  payload_value:=d.payload;
  if d.kind='contact_reply' then
   select * into reply from private.contact_replies where delivery_id=d.id;
   select * into m from private.contact_messages where id=reply.message_id;
   if m.id is null then update private.deliveries set status='failed',last_error='message_unavailable' where id=d.id;continue;end if;
   payload_value:=jsonb_build_object('subject','Re: '||m.subject,'body',reply.body,'signature',(select full_name from public.profiles where id=reply.sent_by));
   update private.contact_replies set delivery_status='sending' where id=reply.id;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('id',d.id,'kind',d.kind,'to_email',d.to_email,'payload',payload_value,'lease_id',d.lease_id));
 end loop;
 return result;
end $$;
revoke all on function private.claim_deliveries(int),public.claim_deliveries(int) from public,anon,authenticated;
grant execute on function private.claim_deliveries(int),public.claim_deliveries(int) to service_role;

create function private.finish_delivery(p_id uuid,p_lease uuid,p_provider text,p_error text,p_retryable boolean) returns void language plpgsql security definer set search_path='' as $$
declare d private.deliveries; next_state text; reply private.contact_replies;
begin
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
revoke all on function private.finish_delivery(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function private.finish_delivery(uuid,uuid,text,text,boolean) to service_role;
create function public.finish_delivery(p_id uuid,p_lease uuid,p_provider text default null,p_error text default null,p_retryable boolean default false) returns void language sql security invoker set search_path='' as $$select private.finish_delivery(p_id,p_lease,p_provider,p_error,p_retryable)$$;
revoke all on function public.finish_delivery(uuid,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.finish_delivery(uuid,uuid,text,text,boolean) to service_role;

create function private.record_delivery_event(p_id text,p_provider text,p_kind text,p_time timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare delivery uuid;
begin
 if char_length(p_id)>200 or char_length(p_provider)>100 or p_time>now()+interval '5 minutes' then raise exception 'Invalid delivery event.' using errcode='23514';end if;
 insert into private.delivery_events(id,provider_id,kind,occurred_at) values(p_id,p_provider,p_kind,p_time) on conflict(id) do nothing;
 if not found then return;end if;
 select id into delivery from private.deliveries where provider_id=p_provider;
 if delivery is not null then perform private.apply_delivery_events(delivery);end if;
end $$;
revoke all on function private.record_delivery_event(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function private.record_delivery_event(text,text,text,timestamptz) to service_role;
create function public.record_delivery_event(p_id text,p_provider text,p_kind text,p_time timestamptz) returns void language sql security invoker set search_path='' as $$select private.record_delivery_event(p_id,p_provider,p_kind,p_time)$$;
revoke all on function public.record_delivery_event(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.record_delivery_event(text,text,text,timestamptz) to service_role;
