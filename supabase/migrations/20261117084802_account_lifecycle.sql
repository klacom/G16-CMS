create table public.invitations (
 id uuid primary key default gen_random_uuid(),
 email text not null check (email=lower(trim(email)) and char_length(email)<=254 and position('@' in email)>1),
 role text not null check(role in ('writer','reviewer','admin')),
 full_name text check(char_length(full_name)<=120),
 affiliation text check(char_length(affiliation)<=160),
 invited_by uuid not null references public.profiles(id),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '24 hours',
 state text not null default 'pending' check(state in ('pending','accepted','withdrawn','expired')),
 accepted_at timestamptz,
 delivery_error boolean not null default false
);
create unique index invitation_pending_email on public.invitations(email) where state='pending';
create index invitations_inviter_idx on public.invitations(invited_by);
alter table public.invitations enable row level security;
grant select on public.invitations to authenticated;
grant all on public.invitations to service_role;
create policy invitations_admin on public.invitations for select to authenticated using((select private.actor_role())='admin');

create table public.notification_preferences (
 user_id uuid primary key references public.profiles(id),
 email_preferences jsonb not null default '{}'
);
alter table public.notification_preferences enable row level security;
grant select on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
create policy preferences_self on public.notification_preferences for select to authenticated using
 (user_id=(select auth.uid()) and (select private.actor_role()) is not null);

create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id),
 kind text not null,
 article_id uuid,
 review_id uuid,
 payload jsonb not null default '{}',
 created_at timestamptz not null default now(),
 read_at timestamptz,
 dedupe_key text not null unique
);
create index notifications_recipient_date on public.notifications(recipient_id,created_at desc,id);
alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy notifications_self on public.notifications for select to authenticated using
 (recipient_id=(select auth.uid()) and (select private.actor_role()) is not null);

create table private.deliveries (
 id uuid primary key default gen_random_uuid(),
 kind text not null,
 recipient_id uuid,
 to_email text not null,
 payload jsonb not null,
 dedupe_key text not null unique,
 status text not null default 'queued' check(status in ('queued','sending','sent','delivered','failed','bounced')),
 attempts int not null default 0,
 available_at timestamptz not null default now(),
 claimed_at timestamptz,
 lease_id uuid,
 provider_id text unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_error text
);
alter table private.deliveries enable row level security;
revoke all on private.deliveries from public,anon,authenticated;
grant all on private.deliveries to service_role;
create index deliveries_work on private.deliveries(available_at) where status in ('queued','sending');

create function private.notify(p_recipient uuid,p_kind text,p_key text,p_article uuid default null,p_review uuid default null,p_payload jsonb default '{}')
 returns void language plpgsql security definer set search_path='' as $$
declare email_address text; notice_id uuid; email_enabled boolean;
begin
 select u.email into email_address from auth.users u join public.profiles p on p.id=u.id where p.id=p_recipient and (p.deactivated_at is null or p_kind in ('password_changed','email_changed','sessions_revoked'));
 if email_address is null then return; end if;
 insert into public.notifications(recipient_id,kind,article_id,review_id,payload,dedupe_key)
 values(p_recipient,p_kind,p_article,p_review,p_payload,p_key) on conflict(dedupe_key) do nothing returning id into notice_id;
 if notice_id is null then return; end if;
 select coalesce((email_preferences->>p_kind)::boolean,true) into email_enabled from public.notification_preferences where user_id=p_recipient;
 if coalesce(email_enabled,true) or p_kind in ('password_changed','email_changed','sessions_revoked') then
  insert into private.deliveries(kind,recipient_id,to_email,payload,dedupe_key)
  values('workflow',p_recipient,email_address,p_payload||jsonb_build_object('kind',p_kind,'article_id',p_article,'review_id',p_review),'notice:'||notice_id)
  on conflict(dedupe_key) do nothing;
 end if;
end $$;
revoke all on function private.notify(uuid,text,text,uuid,uuid,jsonb) from public,anon,authenticated;

create function private.create_invitation(p_email text,p_role text,p_name text,p_affiliation text) returns uuid
 language plpgsql security definer set search_path='' as $$
declare actor uuid; invite_id uuid;
begin
 perform pg_advisory_xact_lock(17011701);
 actor:=private.require_actor(array['admin']);
 if p_role not in ('writer','reviewer','admin') then raise exception 'Invalid role.' using errcode='23514'; end if;
 if exists(select 1 from auth.users u join public.profiles p on p.id=u.id where lower(u.email)=lower(trim(p_email))) then
  raise exception 'This email already has a desk account.' using errcode='23505';
 end if;
 update public.invitations set state='withdrawn' where email=lower(trim(p_email)) and state='pending';
 insert into public.invitations(email,role,full_name,affiliation,invited_by)
 values(lower(trim(p_email)),p_role,nullif(trim(p_name),''),nullif(trim(p_affiliation),''),actor) returning id into invite_id;
 perform private.audit('people','invite_created',invite_id::text,lower(trim(p_email)),jsonb_build_object('role',p_role));
 return invite_id;
end $$;
revoke all on function private.create_invitation(text,text,text,text) from public,anon;
grant execute on function private.create_invitation(text,text,text,text) to authenticated;
create function public.create_invitation(p_email text,p_role text,p_name text default '',p_affiliation text default '') returns uuid
 language sql security invoker set search_path='' as $$select private.create_invitation(p_email,p_role,p_name,p_affiliation)$$;
grant execute on function public.create_invitation(text,text,text,text) to authenticated;

create function private.invitation_details(p_id uuid) returns table(id uuid,email text,role text,full_name text,affiliation text,expires_at timestamptz,inviter_name text)
 language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in from your invitation first.' using errcode='42501'; end if;
 return query select i.id,i.email,i.role,i.full_name,i.affiliation,i.expires_at,p.full_name
 from public.invitations i join public.profiles p on p.id=i.invited_by join auth.users u on lower(u.email)=i.email
 where i.id=p_id and u.id=auth.uid() and u.email_confirmed_at is not null and i.state='pending' and i.expires_at>now()
 and exists(select 1 from auth.sessions s where s.id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=u.id and s.created_at>=i.created_at);
end $$;
revoke all on function private.invitation_details(uuid) from public,anon;
grant execute on function private.invitation_details(uuid) to authenticated;
create function public.invitation_details(p_id uuid) returns table(id uuid,email text,role text,full_name text,affiliation text,expires_at timestamptz,inviter_name text)
 language sql stable security invoker set search_path='' as $$select * from private.invitation_details(p_id)$$;
grant execute on function public.invitation_details(uuid) to authenticated;

create function private.accept_invitation(p_id uuid,p_name text) returns void language plpgsql security definer set search_path='' as $$
declare invitation public.invitations;
begin
 perform pg_advisory_xact_lock(17011701);
 if not exists(select 1 from private.invitation_details(p_id)) then raise exception 'Invitation unavailable.' using errcode='42501'; end if;
 select * into invitation from public.invitations where id=p_id for update;
 insert into public.profiles(id,full_name,role,affiliation,invited_by)
 values(auth.uid(),trim(p_name),invitation.role,invitation.affiliation,invitation.invited_by);
 update public.invitations set state='accepted',accepted_at=clock_timestamp() where id=p_id;
 perform private.audit('people','invite_accepted',p_id::text,p_name);
 perform private.notify(invitation.invited_by,'invite_accepted','invite:'||p_id,null,null,jsonb_build_object('title',p_name||' joined the desk.'));
end $$;
revoke all on function private.accept_invitation(uuid,text) from public,anon;
grant execute on function private.accept_invitation(uuid,text) to authenticated;
create function public.accept_invitation(p_id uuid,p_name text) returns void language sql security invoker set search_path='' as $$select private.accept_invitation(p_id,p_name)$$;
grant execute on function public.accept_invitation(uuid,text) to authenticated;

create function private.withdraw_invitation(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(17011701);
 perform private.require_actor(array['admin']);
 update public.invitations set state='withdrawn' where id=p_id and state='pending';
 if not found then raise exception 'Invitation unavailable.' using errcode='P0002'; end if;
 perform private.audit('people','invite_withdrawn',p_id::text);
end $$;
revoke all on function private.withdraw_invitation(uuid) from public,anon;
grant execute on function private.withdraw_invitation(uuid) to authenticated;
create function public.withdraw_invitation(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.withdraw_invitation(p_id)$$;
grant execute on function public.withdraw_invitation(uuid) to authenticated;

create function private.save_preferences(p_preferences jsonb) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor();
begin
 if jsonb_typeof(p_preferences)<>'object' or exists(select 1 from jsonb_each(p_preferences) x where jsonb_typeof(x.value)<>'boolean' or x.key not in
 ('review_requested','review_accepted','changes_requested','resubmitted','approved','published','invite_accepted','invite_expired','contact_messages','reviewer_stepped_down','goes_live_soon')) then
  raise exception 'Invalid notification preference.' using errcode='23514';
 end if;
 insert into public.notification_preferences(user_id,email_preferences) values(actor,p_preferences)
 on conflict(user_id) do update set email_preferences=excluded.email_preferences;
end $$;
revoke all on function private.save_preferences(jsonb) from public,anon;
grant execute on function private.save_preferences(jsonb) to authenticated;
create function public.save_preferences(p_preferences jsonb) returns void language sql security invoker set search_path='' as $$select private.save_preferences(p_preferences)$$;
grant execute on function public.save_preferences(jsonb) to authenticated;

create function private.read_notification(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor();
begin
 update public.notifications set read_at=coalesce(read_at,now()) where recipient_id=actor and (p_id is null or id=p_id);
end $$;
revoke all on function private.read_notification(uuid) from public,anon;
grant execute on function private.read_notification(uuid) to authenticated;
create function public.read_notification(p_id uuid default null) returns void language sql security invoker set search_path='' as $$select private.read_notification(p_id)$$;
grant execute on function public.read_notification(uuid) to authenticated;

create function private.auth_event(p_user uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_action not in ('password_changed','email_changed','sessions_revoked','signed_in') then raise exception 'Unknown auth event.' using errcode='23514'; end if;
 insert into public.audit_entries(actor_id,actor_role,area,action,target_id) select p_user,role,'security',p_action,p_user::text from public.profiles where id=p_user;
 if p_action<>'signed_in' then perform private.notify(p_user,p_action,'security:'||gen_random_uuid(),null,null,jsonb_build_object('title',replace(p_action,'_',' '))); end if;
end $$;
revoke all on function private.auth_event(uuid,text) from public,anon,authenticated;
grant execute on function private.auth_event(uuid,text) to service_role;
create function public.auth_event(p_user uuid,p_action text) returns void language sql security invoker set search_path='' as $$select private.auth_event(p_user,p_action)$$;
revoke all on function public.auth_event(uuid,text) from public,anon,authenticated;
grant execute on function public.auth_event(uuid,text) to service_role;
