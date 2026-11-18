-- Serialize identical request keys before lookup, including retries that were
-- already waiting on rate-limit locks. Different keys retain independent locks.
create or replace function private.submit_contact(p_key uuid,p_data jsonb,p_honeypot text) returns uuid language plpgsql security definer set search_path='' as $$
declare message_id uuid; fingerprint text; previous_hash text; email_value text; salt text; ip text;
begin
 if coalesce(p_honeypot,'')<>'' then return gen_random_uuid(); end if;
 if p_key is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>20000 or exists(select 1 from jsonb_object_keys(p_data) k where k not in ('topic','first_name','last_name','email','phone','subject','body','article_id','event_title','event_starts_at','event_place')) then raise exception 'Invalid message.' using errcode='23514'; end if;
 perform pg_advisory_xact_lock(hashtextextended('icg:contact-request:'||p_key,0));
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

notify pgrst,'reload schema';
