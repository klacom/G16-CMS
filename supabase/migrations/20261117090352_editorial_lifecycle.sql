alter table private.articles add column withdrawn_from text;
alter table private.review_comments add column request_key uuid not null default gen_random_uuid() unique;

create function private.resolve_request(p_id uuid,p_resolved boolean,p_note text) returns void language plpgsql security definer set search_path='' as $$
declare q private.review_assignments; a private.articles;
begin
 select r.* into q from private.review_assignments r join private.review_requests x on x.assignment_id=r.id where x.id=p_id;
 if q.id is null then raise exception 'Request unavailable.' using errcode='P0002'; end if;
 a:=private.editable_article(q.article_id);
 if a.status<>'draft' or q.round<>(select max(round) from private.review_assignments where article_id=a.id) then raise exception 'This request is not editable.' using errcode='23514'; end if;
 update private.review_requests set resolved_at=case when p_resolved then now() else null end,resolved_by=case when p_resolved then auth.uid() else null end,fix_note=coalesce(p_note,'') where id=p_id;
 perform private.audit('reviews','request_updated',a.id::text,null,jsonb_build_object('request_id',p_id,'resolved',p_resolved));
end $$;
revoke all on function private.resolve_request(uuid,boolean,text) from public,anon;
grant execute on function private.resolve_request(uuid,boolean,text) to authenticated;
create function public.resolve_request(p_id uuid,p_resolved boolean,p_note text default '') returns void language sql security invoker set search_path='' as $$select private.resolve_request(p_id,p_resolved,p_note)$$;
grant execute on function public.resolve_request(uuid,boolean,text) to authenticated;

create function private.add_comment(p_article uuid,p_body text,p_key uuid) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles; actor uuid; rid uuid;
begin
 select * into a from private.articles where id=p_article and deleted_at is null for update;
 actor:=private.require_actor();
 if a.id is null or not private.can_read_article(a.id) or not(a.owner_id=actor or private.actor_role()='admin' or exists(select 1 from private.review_assignments where article_id=a.id and reviewer_id=actor and state='accepted')) then raise exception 'Discussion access denied.' using errcode='42501'; end if;
 if p_key is null then raise exception 'A request key is required.' using errcode='23514'; end if;
 insert into private.review_comments(article_id,author_id,body,request_key) values(a.id,actor,trim(p_body),p_key) on conflict(request_key) do nothing returning id into rid;
 if rid is null then return; end if;
 perform private.audit('reviews','comment_added',a.id::text);
 if actor<>a.owner_id then perform private.notify(a.owner_id,'review_comment','comment:'||rid,a.id,null,jsonb_build_object('title','A new editorial comment.')); end if;
end $$;
revoke all on function private.add_comment(uuid,text,uuid) from public,anon;
grant execute on function private.add_comment(uuid,text,uuid) to authenticated;
create function public.add_comment(p_article uuid,p_body text,p_key uuid) returns void language sql security invoker set search_path='' as $$select private.add_comment(p_article,p_body,p_key)$$;
grant execute on function public.add_comment(uuid,text,uuid) to authenticated;

create function private.change_publication(p_id uuid,p_revision uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles:=private.editable_article(p_id);
begin
 if a.working_revision_id is distinct from p_revision then raise exception 'Article changed.' using errcode='40001'; end if;
 if p_action='delete' then
  if a.published_revision_id is not null then raise exception 'Public history must be preserved.' using errcode='23514'; end if;
  update private.articles set deleted_at=now(),scheduled_at=null where id=a.id;
  update private.review_assignments set state='cancelled' where article_id=a.id and state in ('invited','accepted');
 elsif p_action='cancel_schedule' then update private.articles set scheduled_at=null where id=a.id;
 elsif p_action='archive' and a.visibility='public' then
  update private.articles set visibility='archived',status=case when status='published' then 'archived' else status end,scheduled_at=null,public_updated_at=now() where id=a.id;
 elsif p_action='restore' and a.visibility='archived' then
  update private.articles set visibility='public',status=case when working_revision_id=published_revision_id then 'published' else status end,public_updated_at=now() where id=a.id;
 elsif p_action='withdraw' and a.published_revision_id is not null then
  perform private.require_actor(array['admin']);
  if a.visibility='withdrawn' then return; end if;
  update private.articles set withdrawn_from=visibility,visibility='withdrawn',scheduled_at=null,public_updated_at=now() where id=a.id;
 elsif p_action='restore_withdrawn' and a.visibility='withdrawn' then
  perform private.require_actor(array['admin']);
  update private.articles set visibility=coalesce(withdrawn_from,'public'),withdrawn_from=null,public_updated_at=now() where id=a.id;
 else raise exception 'This publication action is unavailable.' using errcode='23514'; end if;
 perform private.audit('articles',p_action,a.id::text);
end $$;
revoke all on function private.change_publication(uuid,uuid,text) from public,anon;
grant execute on function private.change_publication(uuid,uuid,text) to authenticated;
create function public.change_publication(p_id uuid,p_revision uuid,p_action text) returns void language sql security invoker set search_path='' as $$select private.change_publication(p_id,p_revision,p_action)$$;
grant execute on function public.change_publication(uuid,uuid,text) to authenticated;

create function private.cancel_ineligible_reviews() returns trigger language plpgsql security definer set search_path='' as $$
declare a private.articles;
begin
 if new.role='reviewer' and new.deactivated_at is null then return new; end if;
 if old.role<>'reviewer' then return new; end if;
 for a in select distinct x.* from private.articles x join private.review_assignments q on q.article_id=x.id
 where q.reviewer_id=new.id and (q.state in ('invited','accepted') or q.decision='approved' and x.working_revision_id=q.revision_id and x.status='approved') order by x.id loop
  perform 1 from private.articles where id=a.id for update;
  update private.review_assignments set state='cancelled' where article_id=a.id and reviewer_id=new.id and state in ('invited','accepted');
  update private.articles set status='draft',scheduled_at=null,updated_at=now() where id=a.id;
  perform private.notify(a.owner_id,'reviewer_stepped_down','ineligible:'||a.id||':'||new.id||':'||clock_timestamp(),a.id,null,jsonb_build_object('title','Choose another active reviewer.'));
 end loop;
 return new;
end $$;
revoke all on function private.cancel_ineligible_reviews() from public,anon,authenticated;
create trigger cancel_ineligible_reviews after update of role,deactivated_at on public.profiles for each row execute function private.cancel_ineligible_reviews();

create table private.job_failures(id bigint generated always as identity primary key,job text not null,target_id uuid,code text not null,created_at timestamptz not null default now());
alter table private.job_failures enable row level security;
grant select on private.job_failures to authenticated;
create policy job_failure_admin on private.job_failures for select to authenticated using((select private.actor_role())='admin');
create view public.job_failures with(security_invoker=true) as select * from private.job_failures;
grant select on public.job_failures to authenticated;

create function private.run_editorial_jobs() returns integer language plpgsql security definer set search_path='' as $$
declare a private.articles; i public.invitations; n int:=0; error_code text;
begin
 for a in select * from private.articles where scheduled_at<=now() and status='approved' and deleted_at is null order by scheduled_at,id for update skip locked limit 100 loop
  begin
   perform private.publish_revision(a.id,a.working_revision_id); n:=n+1;
  exception when others then
   get stacked diagnostics error_code=returned_sqlstate;
   insert into private.job_failures(job,target_id,code) values('publication',a.id,error_code);
   update private.articles set scheduled_at=null where id=a.id;
  end;
 end loop;
 for i in update public.invitations set state='expired' where state='pending' and expires_at<=now() returning * loop
  perform private.notify(i.invited_by,'invite_expired','expired:'||i.id,null,null,jsonb_build_object('title','An invitation expired.'));
  perform private.audit('people','invite_expired',i.id::text);
 end loop;
 for a in select * from private.articles where status='approved' and scheduled_at>now() and scheduled_at<=now()+interval '24 hours' loop
  perform private.notify(a.owner_id,'goes_live_soon','soon:'||a.id||':'||a.scheduled_at,a.id,null,jsonb_build_object('title','An approved article is scheduled to go live.'));
 end loop;
 return n;
end $$;
revoke all on function private.run_editorial_jobs() from public,anon,authenticated;
grant execute on function private.run_editorial_jobs() to service_role;
create function public.run_editorial_jobs() returns integer language sql security invoker set search_path='' as $$select private.run_editorial_jobs()$$;
revoke all on function public.run_editorial_jobs() from public,anon,authenticated;
grant execute on function public.run_editorial_jobs() to service_role;

create view public.desk_article_list with(security_invoker=true) as
 select a.id,a.owner_id,a.slug,a.status,a.visibility,a.working_revision_id,a.published_revision_id,a.published_at,a.scheduled_at,a.updated_at,r.title,r.excerpt,r.type
 from private.articles a join private.article_revisions r on r.id=a.working_revision_id
 where (select private.actor_role()) in ('writer','admin') and private.can_read_article(a.id);
grant select on public.desk_article_list to authenticated;
