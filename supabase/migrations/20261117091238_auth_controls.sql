create table private.email_change_authorizations(user_id uuid primary key references public.profiles(id),new_email text not null,authorized_by uuid not null,expires_at timestamptz not null default now()+interval '10 minutes');
alter table private.email_change_authorizations enable row level security;
revoke all on private.email_change_authorizations from public,anon,authenticated;

create function private.authorize_email_change(p_user uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid;
begin
 perform pg_advisory_xact_lock(17011701);
 actor:=private.require_actor(array['admin']);
 if not exists(select 1 from public.profiles where id=p_user) or char_length(p_email)>254 or p_email not like '%@%' then raise exception 'Invalid account email.' using errcode='23514'; end if;
 insert into private.email_change_authorizations(user_id,new_email,authorized_by) values(p_user,lower(trim(p_email)),actor)
 on conflict(user_id) do update set new_email=excluded.new_email,authorized_by=actor,expires_at=now()+interval '10 minutes';
end $$;
revoke all on function private.authorize_email_change(uuid,text) from public,anon;
grant execute on function private.authorize_email_change(uuid,text) to authenticated;
create function public.authorize_email_change(p_user uuid,p_email text) returns void language sql security invoker set search_path='' as $$select private.authorize_email_change(p_user,p_email)$$;
grant execute on function public.authorize_email_change(uuid,text) to authenticated;

create function private.guard_auth_email() returns trigger language plpgsql security definer set search_path='' as $$
declare intended text;
begin
 if not exists(select 1 from public.profiles where id=new.id) then return new; end if;
 if new.email is distinct from old.email then intended:=new.email;
 elsif coalesce(new.email_change,'')<>'' and new.email_change is distinct from old.email_change then intended:=new.email_change;
 else return new; end if;
 if not exists(select 1 from private.email_change_authorizations a join public.profiles p on p.id=a.authorized_by
 where a.user_id=new.id and a.new_email=lower(intended) and a.expires_at>now() and p.role='admin' and p.deactivated_at is null) then
  raise exception 'Ask an ICG admin to change your email.' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.guard_auth_email() from public,anon,authenticated;
create trigger icg_guard_auth_email before update of email,email_change on auth.users for each row execute function private.guard_auth_email();

create function private.capture_auth_changes() returns trigger language plpgsql security definer set search_path='' as $$
declare action_name text; actor_role text; event_key text:=gen_random_uuid()::text;
begin
 select role into actor_role from public.profiles where id=new.id;
 if actor_role is null then return new; end if;
 if new.email is distinct from old.email then action_name:='email_changed';
 elsif new.encrypted_password is distinct from old.encrypted_password then action_name:='password_changed';
 else return new; end if;
 insert into public.audit_entries(actor_id,actor_role,area,action,target_id) values(new.id,actor_role,'security',action_name,new.id::text);
 perform private.notify(new.id,action_name,'auth:'||event_key,null,null,jsonb_build_object('title',replace(action_name,'_',' ')));
 if action_name='email_changed' then
  update public.profiles set sessions_valid_after=clock_timestamp() where id=new.id;
  delete from private.email_change_authorizations where user_id=new.id;
  if old.email is not null then insert into private.deliveries(kind,recipient_id,to_email,payload,dedupe_key)
  values('workflow',new.id,old.email,jsonb_build_object('kind','email_changed','title','The sign-in address for your ICG account changed.'),'auth-old-address:'||event_key); end if;
 end if;
 return new;
end $$;
revoke all on function private.capture_auth_changes() from public,anon,authenticated;
create trigger icg_capture_auth_changes after update of email,encrypted_password on auth.users for each row execute function private.capture_auth_changes();

create function private.people_directory(p_offset int,p_filter text,p_query text) returns table(id uuid,full_name text,email text,role text,affiliation text,created_at timestamptz,deactivated_at timestamptz,total bigint)
 language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['admin']);
 return query select p.id,p.full_name,u.email::text,p.role,p.affiliation,p.created_at,p.deactivated_at,count(*) over()
 from public.profiles p join auth.users u on u.id=p.id where
 (p_filter='' or p_filter='inactive' and p.deactivated_at is not null or p_filter=p.role and p.deactivated_at is null)
 and (coalesce(p_query,'')='' or p.full_name ilike '%'||left(p_query,120)||'%' or u.email ilike '%'||left(p_query,120)||'%')
 order by p.full_name,p.id limit 50 offset greatest(0,least(coalesce(p_offset,0),100000));
end $$;
revoke all on function private.people_directory(int,text,text) from public,anon;
grant execute on function private.people_directory(int,text,text) to authenticated;
create function public.people_directory(p_offset int default 0,p_filter text default '',p_query text default '') returns table(id uuid,full_name text,email text,role text,affiliation text,created_at timestamptz,deactivated_at timestamptz,total bigint)
 language sql stable security invoker set search_path='' as $$select * from private.people_directory(p_offset,p_filter,p_query)$$;
grant execute on function public.people_directory(int,text,text) to authenticated;
