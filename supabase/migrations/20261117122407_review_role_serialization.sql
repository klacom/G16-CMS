-- Serialize reviewer eligibility, decisions and release with role/deactivation changes.
-- All participating entry points take the identity advisory lock before article
-- row locks, including the due-publication job; nested calls reuse that lock.

create or replace function private.submit_article(p_id uuid,p_revision uuid,p_version int,p_reviewer uuid,p_deadline timestamptz,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare a private.articles; r private.article_revisions; qid uuid; round_number int;
begin
 perform pg_advisory_xact_lock(17011701);
 a:=private.editable_article(p_id);
 select * into r from private.article_revisions where id=a.working_revision_id;
 if r.id is distinct from p_revision or r.version is distinct from p_version then raise exception 'Revision changed.' using errcode='40001'; end if;
 if a.status<>'draft' or r.sealed_at is not null or trim(r.excerpt)='' or trim(r.body_text)='' or r.category_id is null then raise exception 'Complete the title, summary, category and story first.' using errcode='23514'; end if;
 if exists(select 1 from private.categories where id=r.category_id and archived_at is not null) then raise exception 'Choose an active category.' using errcode='23514'; end if;
 if r.type='event' and (r.event_starts_at is null or r.venue is null) then raise exception 'Complete the event date and venue.' using errcode='23514'; end if;
 if p_reviewer=a.owner_id or p_reviewer=any(r.editor_ids) or not exists(select 1 from public.profiles where id=p_reviewer and role='reviewer' and deactivated_at is null) then raise exception 'Choose an independent active reviewer.' using errcode='23514'; end if;
 if exists(select 1 from private.review_requests x join private.review_assignments q on q.id=x.assignment_id where q.article_id=a.id and q.round=(select max(round) from private.review_assignments where article_id=a.id) and x.resolved_at is null) then raise exception 'Address the requested changes before resubmitting.' using errcode='23514'; end if;
 update private.article_revisions set sealed_at=clock_timestamp(),byline_name=p.full_name,byline_affiliation=p.affiliation from public.profiles p where private.article_revisions.id=r.id and p.id=a.owner_id;
 select coalesce(max(round),0)+1 into round_number from private.review_assignments where article_id=a.id;
 insert into private.review_assignments(article_id,revision_id,reviewer_id,requested_by,round,needed_by,note)
 values(a.id,r.id,p_reviewer,auth.uid(),round_number,p_deadline,coalesce(p_note,'')) returning id into qid;
 update private.articles set status='in_review',scheduled_at=null,updated_at=clock_timestamp() where id=a.id;
 perform private.audit('reviews','review_requested',a.id::text,r.title,jsonb_build_object('round',round_number));
 perform private.notify(p_reviewer,case when round_number>1 then 'resubmitted' else 'review_requested' end,'review:'||qid,a.id,qid,jsonb_build_object('title',r.title));
 return qid;
end $$;

create or replace function private.review_action(p_id uuid,p_action text,p_note text,p_requests text[]) returns void language plpgsql security definer set search_path='' as $$
declare q private.review_assignments; a private.articles; r private.article_revisions; request_text text; actor uuid;
begin
 perform pg_advisory_xact_lock(17011701);
 select * into q from private.review_assignments where id=p_id;
 if q.id is null then raise exception 'Review unavailable.' using errcode='P0002'; end if;
 select * into a from private.articles where id=q.article_id for update;
 actor:=private.require_actor(array['reviewer']);
 select * into q from private.review_assignments where id=p_id for update;
 if q.reviewer_id<>actor then raise exception 'Review access denied.' using errcode='42501'; end if;
 select * into r from private.article_revisions where id=q.revision_id;
 if q.state='decided' and ((p_action='approve' and q.decision='approved') or (p_action='changes' and q.decision='changes_requested')) then return; end if;
 if a.working_revision_id<>r.id or a.status<>'in_review' then raise exception 'This submission changed.' using errcode='40001'; end if;
 if p_action='accept' and q.state='invited' then
  update private.review_assignments set state='accepted',responded_at=clock_timestamp() where id=q.id;
 elsif p_action='decline' and q.state='invited' or p_action='step_down' and q.state='accepted' then
  update private.review_assignments set state=case when p_action='decline' then 'declined' else 'stepped_down' end,responded_at=clock_timestamp() where id=q.id;
  update private.articles set status='draft',scheduled_at=null where id=a.id;
 elsif p_action in ('approve','changes') and q.state='accepted' then
  if actor=a.owner_id or actor=any(r.editor_ids) then raise exception 'Independent approval required.' using errcode='42501'; end if;
  if p_action='changes' and (coalesce(cardinality(p_requests),0)=0 or cardinality(p_requests)>30) then raise exception 'Add at least one request.' using errcode='23514'; end if;
  if p_action='changes' then
   foreach request_text in array p_requests loop insert into private.review_requests(assignment_id,text) values(q.id,trim(request_text)); end loop;
  end if;
  update private.review_assignments set state='decided',decision=case when p_action='approve' then 'approved' else 'changes_requested' end,decision_note=coalesce(p_note,''),decided_at=clock_timestamp() where id=q.id;
  update private.articles set status=case when p_action='approve' then 'approved' else 'draft' end,scheduled_at=null,updated_at=clock_timestamp() where id=a.id;
 else raise exception 'This review action is no longer available.' using errcode='23514'; end if;
 perform private.audit('reviews','review_'||p_action,a.id::text,r.title,jsonb_build_object('round',q.round));
 perform private.notify(a.owner_id,case p_action when 'approve' then 'approved' when 'changes' then 'changes_requested' when 'accept' then 'review_accepted' else 'reviewer_stepped_down' end,'decision:'||q.id||':'||p_action,a.id,q.id,jsonb_build_object('title',r.title));
end $$;

create or replace function private.publish_revision(p_id uuid,p_revision uuid) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles; r private.article_revisions; reviewer uuid;
begin
 perform pg_advisory_xact_lock(17011701);
 select * into a from private.articles where id=p_id for update;
 if a.working_revision_id is distinct from p_revision or a.status<>'approved' or a.visibility='withdrawn' then raise exception 'An approved current revision is required.' using errcode='23514'; end if;
 select * into r from private.article_revisions where id=p_revision;
 select q.reviewer_id into reviewer from private.review_assignments q join public.profiles p on p.id=q.reviewer_id
 where q.revision_id=p_revision and q.decision='approved' and q.state='decided' and p.role='reviewer' and p.deactivated_at is null
 and q.reviewer_id<>a.owner_id and not(q.reviewer_id=any(r.editor_ids)) order by q.round desc limit 1;
 if reviewer is null then raise exception 'Independent active reviewer approval is required.' using errcode='23514'; end if;
 if r.display_until is not null and r.display_until<=now() then raise exception 'The announcement expiry must be after publication.' using errcode='23514'; end if;
 update private.articles set published_revision_id=p_revision,visibility='public',status='published',scheduled_at=null,published_at=now(),first_published_at=coalesce(first_published_at,now()),public_updated_at=now(),updated_at=now() where id=p_id;
 perform private.audit('articles','published',p_id::text,r.title,jsonb_build_object('revision_id',p_revision));
 perform private.notify(a.owner_id,'published','publication:'||p_revision,p_id,null,jsonb_build_object('title',r.title));
 perform private.notify(reviewer,'published','reviewer-publication:'||p_revision,p_id,null,jsonb_build_object('title',r.title));
end $$;

create or replace function private.publish_article(p_id uuid,p_revision uuid,p_schedule timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles;
begin
 perform pg_advisory_xact_lock(17011701);
 a:=private.editable_article(p_id);
 if a.published_revision_id=p_revision and a.status='published' and a.visibility='public' then return; end if;
 if a.working_revision_id is distinct from p_revision or a.status<>'approved' or a.visibility='withdrawn' then raise exception 'Approve the current revision before publishing.' using errcode='23514'; end if;
 if p_schedule is not null and p_schedule>clock_timestamp() then
  if exists(select 1 from private.article_revisions where id=p_revision and display_until<=p_schedule) then raise exception 'Expiry precedes publication.' using errcode='23514'; end if;
  update private.articles set scheduled_at=p_schedule,updated_at=clock_timestamp() where id=p_id;
  perform private.audit('articles','scheduled',p_id::text,null,jsonb_build_object('scheduled_at',p_schedule));
 else perform private.publish_revision(p_id,p_revision); end if;
end $$;

create or replace function private.run_editorial_jobs() returns integer language plpgsql security definer set search_path='' as $$
declare a private.articles; i public.invitations; n int:=0; error_code text;
begin
 perform pg_advisory_xact_lock(17011701);
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

create or replace function private.cancel_ineligible_reviews() returns trigger language plpgsql security definer set search_path='' as $$
declare candidate private.articles; a private.articles;
begin
 if new.role='reviewer' and new.deactivated_at is null then return new; end if;
 if old.role<>'reviewer' then return new; end if;
 for candidate in select distinct x.* from private.articles x join private.review_assignments q on q.article_id=x.id
 where q.reviewer_id=new.id and (q.state in ('invited','accepted') or q.decision='approved' and x.working_revision_id=q.revision_id and x.status='approved') order by x.id loop
  -- A concurrent draft edit may have completed while this row lock waited.
  -- Re-evaluate the current assignment/revision before changing its workflow.
  select * into a from private.articles where id=candidate.id for update;
  if not exists(select 1 from private.review_assignments q where q.article_id=a.id and q.reviewer_id=new.id
   and (q.state in ('invited','accepted') or q.decision='approved' and a.working_revision_id=q.revision_id and a.status='approved')) then continue; end if;
  update private.review_assignments set state='cancelled' where article_id=a.id and reviewer_id=new.id and state in ('invited','accepted');
  update private.articles set status='draft',scheduled_at=null,updated_at=now() where id=a.id;
  perform private.notify(a.owner_id,'reviewer_stepped_down','ineligible:'||a.id||':'||new.id||':'||clock_timestamp(),a.id,null,jsonb_build_object('title','Choose another active reviewer.'));
 end loop;
 return new;
end $$;

notify pgrst,'reload schema';
