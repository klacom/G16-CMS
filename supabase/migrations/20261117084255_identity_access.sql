create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 full_name text not null check (char_length(trim(full_name)) between 3 and 120),
 role text not null check (role in ('writer','reviewer','admin')),
 affiliation text check (char_length(affiliation) <= 160),
 avatar_path text,
 invited_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 deactivated_at timestamptz,
 sessions_valid_after timestamptz not null default '-infinity'
);
create index profiles_role_idx on public.profiles(role) where deactivated_at is null;
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Private, deliberately privileged lookup prevents recursive profile policies.
-- Every result is bound to the signed caller and an existing Auth session.
create function private.actor_role() returns text language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p
 where p.id=(select auth.uid()) and p.deactivated_at is null
 and exists(select 1 from auth.sessions s where s.id=nullif(auth.jwt()->>'session_id','')::uuid
   and s.user_id=p.id and s.created_at>=p.sessions_valid_after)
$$;
revoke all on function private.actor_role() from public, anon;
grant execute on function private.actor_role() to authenticated;

create function private.require_actor(roles text[] default array['writer','reviewer','admin']) returns uuid
 language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.actor_role()=any(roles),false) then
   raise exception 'Your session cannot perform this action.' using errcode='42501';
 end if;
 return auth.uid();
end $$;
revoke all on function private.require_actor(text[]) from public, anon;
grant execute on function private.require_actor(text[]) to authenticated;

create policy profiles_read on public.profiles for select to authenticated using
 ((select private.actor_role()) is not null and (id=(select auth.uid()) or (select private.actor_role())='admin'));

create table public.audit_entries (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(),
 actor_id uuid,
 actor_role text,
 area text not null,
 action text not null,
 target_id text,
 target_label text,
 changes jsonb not null default '{}'
);
create index audit_entries_created_idx on public.audit_entries(created_at desc,id desc);
alter table public.audit_entries enable row level security;
revoke all on public.audit_entries from anon,authenticated;
grant select on public.audit_entries to authenticated;
create policy audit_admin_read on public.audit_entries for select to authenticated using
 ((select private.actor_role())='admin');
grant all on public.audit_entries to service_role;
grant usage on sequence public.audit_entries_id_seq to service_role;

create function private.audit(area text,action text,target_id text default null,target_label text default null,changes jsonb default '{}')
 returns void language sql security definer set search_path='' as $$
 insert into public.audit_entries(actor_id,actor_role,area,action,target_id,target_label,changes)
 values(auth.uid(),private.actor_role(),area,action,target_id,left(target_label,240),changes)
$$;
revoke all on function private.audit(text,text,text,text,jsonb) from public,anon,authenticated;

create function public.current_profile() returns setof public.profiles language sql stable security invoker set search_path='' as $$
 select * from public.profiles where id=auth.uid()
$$;
grant execute on function public.current_profile() to authenticated;

create function private.reviewer_directory() returns table(id uuid,full_name text,affiliation text)
 language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor();
 return query select p.id,p.full_name,p.affiliation from public.profiles p
 where p.role='reviewer' and p.deactivated_at is null and p.id<>auth.uid() order by p.full_name,p.id limit 200;
end $$;
revoke all on function private.reviewer_directory() from public,anon;
grant execute on function private.reviewer_directory() to authenticated;
create function public.reviewer_directory() returns table(id uuid,full_name text,affiliation text)
 language sql stable security invoker set search_path='' as $$select * from private.reviewer_directory()$$;
grant execute on function public.reviewer_directory() to authenticated;

create function private.save_profile(p_name text,p_avatar text) returns void
 language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor();
begin
 if char_length(trim(p_name)) not between 3 and 120 or p_avatar is not null then
   raise exception 'Enter a name between 3 and 120 characters. Photos must use the upload action.' using errcode='23514';
 end if;
 update public.profiles set full_name=trim(p_name) where id=actor;
 perform private.audit('people','profile_saved',actor::text,p_name);
end $$;
revoke all on function private.save_profile(text,text) from public,anon;
grant execute on function private.save_profile(text,text) to authenticated;
create function public.save_profile(p_name text,p_avatar text default null) returns void
 language sql security invoker set search_path='' as $$select private.save_profile(p_name,p_avatar)$$;
grant execute on function public.save_profile(text,text) to authenticated;

create function private.manage_person(p_id uuid,p_patch jsonb) returns void
 language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(array['admin']); person public.profiles; new_role text; inactive boolean;
begin
 perform pg_advisory_xact_lock(17011701);
 select * into person from public.profiles where id=p_id for update;
 actor:=private.require_actor(array['admin']);
 if not found then raise exception 'Person not found.' using errcode='P0002'; end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('role','affiliation','deactivated')) then
   raise exception 'Invalid person changes.' using errcode='23514';
 end if;
 new_role:=coalesce(p_patch->>'role',person.role);
 inactive:=coalesce((p_patch->>'deactivated')::boolean,person.deactivated_at is not null);
 if new_role not in ('writer','reviewer','admin') then raise exception 'Choose a valid role.' using errcode='23514'; end if;
 if person.role='admin' and person.deactivated_at is null and (new_role<>'admin' or inactive)
   and (select count(*) from public.profiles where role='admin' and deactivated_at is null)<=1 then
   raise exception 'Keep at least one active admin.' using errcode='23514';
 end if;
 update public.profiles set role=new_role,
   affiliation=case when p_patch?'affiliation' then nullif(trim(p_patch->>'affiliation'),'') else affiliation end,
   deactivated_at=case when inactive then coalesce(deactivated_at,clock_timestamp()) else null end,
   sessions_valid_after=case when inactive or person.deactivated_at is not null then clock_timestamp() else sessions_valid_after end
 where id=p_id;
 -- Preserve the authority used for this action even after self-demotion.
 insert into public.audit_entries(actor_id,actor_role,area,action,target_id,target_label,changes)
 values(actor,'admin','people','person_updated',p_id::text,person.full_name,
   jsonb_build_object('role',new_role,'deactivated',inactive,'affiliation_changed',p_patch?'affiliation'));
end $$;
revoke all on function private.manage_person(uuid,jsonb) from public,anon;
grant execute on function private.manage_person(uuid,jsonb) to authenticated;
create function public.manage_person(p_id uuid,p_patch jsonb) returns void
 language sql security invoker set search_path='' as $$select private.manage_person(p_id,p_patch)$$;
grant execute on function public.manage_person(uuid,jsonb) to authenticated;

create function private.bootstrap_admin(p_id uuid,p_name text) returns void
 language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(17011701);
 if exists(select 1 from public.profiles where role='admin' and deactivated_at is null) then
   raise exception 'An admin already exists.' using errcode='23514';
 end if;
 if not exists(select 1 from auth.users where id=p_id and email_confirmed_at is not null) then
   raise exception 'A verified Auth account is required.' using errcode='23514';
 end if;
 insert into public.profiles(id,full_name,role) values(p_id,trim(p_name),'admin');
 perform private.audit('people','admin_bootstrapped',p_id::text,p_name);
end $$;
revoke all on function private.bootstrap_admin(uuid,text) from public,anon,authenticated;
grant execute on function private.bootstrap_admin(uuid,text) to service_role;
create function public.bootstrap_admin(p_id uuid,p_name text) returns void
 language sql security invoker set search_path='' as $$select private.bootstrap_admin(p_id,p_name)$$;
revoke all on function public.bootstrap_admin(uuid,text) from public,anon,authenticated;
grant execute on function public.bootstrap_admin(uuid,text) to service_role;
