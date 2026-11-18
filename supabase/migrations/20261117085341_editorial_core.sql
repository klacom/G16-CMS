-- Domain tables are not in a Data API-exposed schema. Explicit invoker views
-- separate public publication fields from permission-filtered desk records.
create table private.categories (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(trim(name)) between 1 and 80),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), archived_at timestamptz
);
create unique index categories_name_unique on private.categories(lower(name));
create table private.articles (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 slug text not null unique, status text not null default 'draft' check(status in ('draft','in_review','approved','published','archived')),
 visibility text not null default 'unpublished' check(visibility in ('unpublished','public','archived','withdrawn')),
 working_revision_id uuid, published_revision_id uuid, scheduled_at timestamptz,
 published_at timestamptz, first_published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), public_updated_at timestamptz,
 deleted_at timestamptz
);
create index articles_owner on private.articles(owner_id,updated_at desc);
create index articles_due on private.articles(scheduled_at) where status='approved';
create table private.article_revisions (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references private.articles(id),
 version integer not null default 1, parent_revision_id uuid references private.article_revisions(id),
 title text not null check(char_length(title) between 1 and 240), excerpt text not null default '' check(char_length(excerpt)<=200),
 type text not null check(type in ('news','event','announcement')), category_id uuid references private.categories(id),
 tags text[] not null default '{}', body jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}', body_text text not null default '',
 images jsonb not null default '[]', event_starts_at timestamptz, event_ends_at timestamptz, venue text, map_url text, display_until timestamptz,
 editor_ids uuid[] not null, byline_name text, byline_affiliation text,
 created_at timestamptz not null default now(), sealed_at timestamptz,
 search_document tsvector generated always as(to_tsvector('pg_catalog.simple',title||' '||excerpt||' '||body_text)) stored,
 check(event_ends_at is null or (event_starts_at is not null and event_ends_at>event_starts_at)),
 check(char_length(venue)<=240), check(cardinality(tags)<=20), check(jsonb_array_length(images)<=20)
);
create index revision_article on private.article_revisions(article_id);
create index revision_search on private.article_revisions using gin(search_document);
create index revision_event_start on private.article_revisions(event_starts_at) where type='event';
alter table private.articles add foreign key(working_revision_id) references private.article_revisions(id);
alter table private.articles add foreign key(published_revision_id) references private.article_revisions(id);

create table private.review_assignments (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references private.articles(id), revision_id uuid not null references private.article_revisions(id),
 reviewer_id uuid not null references public.profiles(id), requested_by uuid not null references public.profiles(id), round integer not null,
 state text not null default 'invited' check(state in ('invited','accepted','declined','stepped_down','decided','cancelled')),
 decision text check(decision in ('approved','changes_requested')), needed_by timestamptz, note text not null default '', decision_note text not null default '',
 created_at timestamptz not null default now(), responded_at timestamptz, decided_at timestamptz,
 unique(article_id,round),check(char_length(note)<=2000),check(char_length(decision_note)<=4000)
);
create index reviews_reviewer on private.review_assignments(reviewer_id,state,created_at);
create index reviews_revision on private.review_assignments(revision_id);
create table private.review_requests (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references private.review_assignments(id),
 text text not null check(char_length(trim(text)) between 1 and 1000), resolved_at timestamptz, resolved_by uuid references public.profiles(id), fix_note text not null default '' check(char_length(fix_note)<=1000)
);
create index requests_assignment on private.review_requests(assignment_id);
create table private.review_comments (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references private.articles(id), author_id uuid not null references public.profiles(id),
 body text not null check(char_length(trim(body)) between 1 and 4000), created_at timestamptz not null default now()
);
create index comments_article on private.review_comments(article_id,created_at);

create function private.can_read_article(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.actor_role() is not null and exists(select 1 from private.articles a where a.id=p_id and a.deleted_at is null
 and (a.owner_id=auth.uid() or private.actor_role()='admin' or (private.actor_role()='reviewer' and exists(select 1 from private.review_assignments q where q.article_id=a.id and q.reviewer_id=auth.uid() and q.state in ('invited','accepted','decided')))))
$$;
create function private.can_read_revision(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.actor_role() is not null and exists(select 1 from private.article_revisions r join private.articles a on a.id=r.article_id
 where r.id=p_id and a.deleted_at is null and (a.owner_id=auth.uid() or private.actor_role()='admin'
 or (private.actor_role()='reviewer' and exists(select 1 from private.review_assignments q where q.revision_id=r.id and q.reviewer_id=auth.uid() and q.state in ('accepted','decided')))))
$$;
revoke all on function private.can_read_article(uuid),private.can_read_revision(uuid) from public;
grant execute on function private.can_read_article(uuid),private.can_read_revision(uuid) to anon,authenticated;
grant usage on schema private to anon;

alter table private.categories enable row level security;
alter table private.articles enable row level security;
alter table private.article_revisions enable row level security;
alter table private.review_assignments enable row level security;
alter table private.review_requests enable row level security;
alter table private.review_comments enable row level security;
grant select on private.categories,private.articles,private.article_revisions,private.review_assignments,private.review_requests,private.review_comments to anon,authenticated;
grant all on private.categories,private.articles,private.article_revisions,private.review_assignments,private.review_requests,private.review_comments to service_role;
create policy categories_read on private.categories for select to anon,authenticated using(true);
create policy article_public on private.articles for select to anon,authenticated using(published_revision_id is not null and visibility in ('public','archived') and published_at<=now() and deleted_at is null);
create policy article_desk on private.articles for select to authenticated using(private.can_read_article(id));
create policy revision_public on private.article_revisions for select to anon,authenticated using(exists(select 1 from private.articles a where a.published_revision_id=private.article_revisions.id and a.visibility in ('public','archived') and a.published_at<=now() and a.deleted_at is null));
create policy revision_desk on private.article_revisions for select to authenticated using(private.can_read_revision(id));
create policy assignment_read on private.review_assignments for select to authenticated using((select private.actor_role()) is not null and private.can_read_article(article_id)
 and (reviewer_id=(select auth.uid()) or (select private.actor_role())='admin' or exists(select 1 from private.articles a where a.id=article_id and a.owner_id=(select auth.uid()))));
create policy requests_read on private.review_requests for select to authenticated using(exists(select 1 from private.review_assignments q where q.id=assignment_id and private.can_read_revision(q.revision_id)));
create policy comments_read on private.review_comments for select to authenticated using(private.can_read_article(article_id) and
 (exists(select 1 from private.articles a where a.id=article_id and (a.owner_id=(select auth.uid()) or (select private.actor_role())='admin'))
 or exists(select 1 from private.review_assignments q where q.article_id=private.review_comments.article_id and q.reviewer_id=(select auth.uid()) and q.state in ('accepted','decided'))));

create view public.categories with(security_invoker=true) as select * from private.categories;
create view public.articles with(security_invoker=true) as select * from private.articles where private.can_read_article(id);
create view public.article_revisions with(security_invoker=true) as select * from private.article_revisions where private.can_read_revision(id);
create view public.review_assignments with(security_invoker=true) as select * from private.review_assignments;
create view public.review_requests with(security_invoker=true) as select * from private.review_requests;
create view public.review_comments with(security_invoker=true) as select * from private.review_comments;
create view public.public_articles with(security_invoker=true) as
 select a.id,a.slug,a.visibility,a.published_at,a.first_published_at,coalesce(a.public_updated_at,a.published_at) as updated_at,
 r.title,r.excerpt,r.type,r.body,r.images,r.tags,r.category_id,c.name as category_name,c.slug as category_slug,
 r.event_starts_at,r.event_ends_at,r.venue,r.map_url,r.display_until,r.byline_name,r.byline_affiliation,r.search_document
 from private.articles a join private.article_revisions r on r.id=a.published_revision_id left join private.categories c on c.id=r.category_id
 where a.visibility in ('public','archived') and a.published_at<=now() and a.deleted_at is null;
grant select on public.categories,public.articles,public.public_articles to anon,authenticated;
grant select on public.article_revisions,public.review_assignments,public.review_requests,public.review_comments to authenticated;

create function private.valid_rich_node(n jsonb,depth integer default 0) returns boolean language plpgsql immutable set search_path='' as $$
declare child jsonb; mark jsonb; kind text:=n->>'type';
begin
 if depth>20 or jsonb_typeof(n) is distinct from 'object' or kind is null or kind not in ('doc','paragraph','text','heading','bulletList','orderedList','listItem','blockquote','hardBreak','horizontalRule','image','video') then return false; end if;
 if exists(select 1 from jsonb_object_keys(n) k where k not in ('type','text','attrs','marks','content')) then return false;end if;
 if depth=0 and (select count(*) from jsonb_path_query(n,'strict $.**') x where jsonb_typeof(x)='object' and x->>'type' in ('doc','paragraph','text','heading','bulletList','orderedList','listItem','blockquote','hardBreak','horizontalRule','image','video'))>2500 then return false;end if;
 if kind='text' and jsonb_typeof(n->'text') is distinct from 'string' then return false; end if;
 if n?'text' and (kind<>'text' or jsonb_typeof(n->'text') is distinct from 'string' or char_length(n->>'text')>100000) then return false;end if;
 if n?'attrs' then
  if jsonb_typeof(n->'attrs') is distinct from 'object' then return false;end if;
  if exists(select 1 from jsonb_each(n->'attrs') a where jsonb_typeof(a.value) not in ('string','number','boolean','null')) then return false;end if;
 end if;
 if kind in ('text','hardBreak','horizontalRule','image','video') and n?'content' then return false;end if;
 if kind='heading' and coalesce((n#>>'{attrs,level}') not in ('2','3','4'),true) then return false; end if;
 if kind='image' and coalesce((n#>>'{attrs,src}')!~'^/media/[0-9a-f-]{36}$',true) then return false; end if;
 if kind='video' and coalesce((n#>>'{attrs,src}')!~'^https://(www\.youtube-nocookie\.com/embed/[A-Za-z0-9_-]{11}|player\.vimeo\.com/video/[0-9]{1,12})$',true) then return false; end if;
 if n?'marks' then
  if jsonb_typeof(n->'marks') is distinct from 'array' then return false; end if;
  for mark in select * from jsonb_array_elements(n->'marks') loop
   if jsonb_typeof(mark) is distinct from 'object' or coalesce(mark->>'type','') not in ('bold','italic','strike','underline','link') then return false; end if;
   if exists(select 1 from jsonb_object_keys(mark) k where k not in ('type','attrs')) then return false;end if;
   if mark?'attrs' then
    if jsonb_typeof(mark->'attrs') is distinct from 'object' then return false;end if;
    if exists(select 1 from jsonb_each(mark->'attrs') a where jsonb_typeof(a.value) not in ('string','number','boolean','null')) then return false;end if;
   end if;
   if mark->>'type'='link' and coalesce(mark#>>'{attrs,href}','')!~'^(https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]]*)?|mailto:[^[:space:]]*)$' then return false; end if;
  end loop;
 end if;
 if n?'content' then
  if jsonb_typeof(n->'content') is distinct from 'array' then return false;end if;
  if jsonb_array_length(n->'content')>2500 then return false;end if;
  for child in select * from jsonb_array_elements(n->'content') loop if not private.valid_rich_node(child,depth+1) then return false; end if; end loop;
 end if;
 return true;
end $$;
revoke all on function private.valid_rich_node(jsonb,integer) from public,anon,authenticated;

create function private.editable_article(p_id uuid) returns private.articles language plpgsql security definer set search_path='' as $$
declare a private.articles; actor uuid;
begin
 select * into a from private.articles where id=p_id and deleted_at is null for update;
 actor:=private.require_actor(array['writer','admin']);
 if not found or a.id is null then raise exception 'Article unavailable.' using errcode='P0002'; end if;
 if a.owner_id<>actor and private.actor_role()<>'admin' then raise exception 'Article access denied.' using errcode='42501'; end if;
 return a;
end $$;
revoke all on function private.editable_article(uuid) from public,anon,authenticated;

create function private.create_article(p_title text,p_type text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(array['writer','admin']); aid uuid:=gen_random_uuid(); rid uuid;
begin
 if p_type not in ('news','event','announcement') then raise exception 'Invalid article type.' using errcode='23514'; end if;
 insert into private.articles(id,owner_id,slug) values(aid,actor,left(trim(both '-' from regexp_replace(lower(p_title),'[^a-z0-9]+','-','g')),80)||'-'||left(aid::text,8));
 insert into private.article_revisions(article_id,title,type,editor_ids) values(aid,trim(p_title),p_type,array[actor]) returning id into rid;
 update private.articles set working_revision_id=rid where id=aid;
 perform private.audit('articles','draft_created',aid::text,p_title);
 return aid;
end $$;
revoke all on function private.create_article(text,text) from public,anon;
grant execute on function private.create_article(text,text) to authenticated;
create function public.create_article(p_title text,p_type text default 'news') returns uuid language sql security invoker set search_path='' as $$select private.create_article(p_title,p_type)$$;
grant execute on function public.create_article(text,text) to authenticated;

create function private.save_article(p_id uuid,p_revision uuid,p_version int,p_patch jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.articles:=private.editable_article(p_id); r private.article_revisions; body_value jsonb; new_id uuid; merged jsonb;
begin
 select * into r from private.article_revisions where id=a.working_revision_id;
 if r.id is distinct from p_revision or r.version is distinct from p_version then raise exception 'Revision changed.' using errcode='40001'; end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('title','excerpt','type','category_id','tags','body','images','event_starts_at','event_ends_at','venue','map_url','display_until')) then raise exception 'Invalid article fields.' using errcode='23514'; end if;
 merged:=to_jsonb(r)||p_patch;
 body_value:=merged->'body';
 if body_value->>'type'<>'doc' or octet_length(body_value::text)>512000 or not private.valid_rich_node(body_value) then raise exception 'Unsupported article content.' using errcode='23514'; end if;
 if merged->>'type' not in ('news','event','announcement') or jsonb_typeof(merged->'tags')<>'array' or jsonb_typeof(merged->'images')<>'array' then raise exception 'Invalid article details.' using errcode='23514'; end if;
 if coalesce(merged->>'map_url','')<>'' and (merged->>'map_url')!~'^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.openstreetmap\.org|openstreetmap\.org)/' then raise exception 'Use an approved map link.' using errcode='23514'; end if;
 if exists(select 1 from jsonb_array_elements_text(merged->'tags') t where char_length(t)>48 or char_length(trim(t))=0) then raise exception 'Invalid tag.' using errcode='23514'; end if;
 if r.sealed_at is not null then
  new_id:=gen_random_uuid();
  insert into private.article_revisions(id,article_id,parent_revision_id,title,type,editor_ids)
  values(new_id,a.id,r.id,r.title,r.type,case when auth.uid()=any(r.editor_ids) then r.editor_ids else array_append(r.editor_ids,auth.uid()) end);
  update private.review_assignments set state='cancelled' where article_id=a.id and state in ('invited','accepted');
  update private.articles set working_revision_id=new_id,status='draft',scheduled_at=null where id=a.id;
 else new_id:=r.id; end if;
 update private.article_revisions set title=trim(merged->>'title'),excerpt=coalesce(merged->>'excerpt',''),type=merged->>'type',
  category_id=nullif(merged->>'category_id','')::uuid,tags=array(select distinct trim(t) from jsonb_array_elements_text(merged->'tags') t),
  body=body_value,body_text=coalesce((select string_agg(x#>>'{}',' ') from jsonb_path_query(body_value,'$.** ? (@.type == "text").text') x),''),
  images=merged->'images',event_starts_at=nullif(merged->>'event_starts_at','')::timestamptz,event_ends_at=nullif(merged->>'event_ends_at','')::timestamptz,
  venue=nullif(trim(merged->>'venue'),''),map_url=nullif(merged->>'map_url',''),display_until=nullif(merged->>'display_until','')::timestamptz,
  version=case when new_id=r.id then r.version+1 else 1 end,
  editor_ids=case when auth.uid()=any(editor_ids) then editor_ids else array_append(editor_ids,auth.uid()) end
 where id=new_id;
 update private.articles set updated_at=clock_timestamp() where id=a.id;
 perform private.audit('articles','draft_saved',a.id::text,merged->>'title');
 return (select jsonb_build_object('revision_id',id,'version',version) from private.article_revisions where id=new_id);
end $$;
revoke all on function private.save_article(uuid,uuid,int,jsonb) from public,anon;
grant execute on function private.save_article(uuid,uuid,int,jsonb) to authenticated;
create function public.save_article(p_id uuid,p_revision uuid,p_version int,p_patch jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.save_article(p_id,p_revision,p_version,p_patch)$$;
grant execute on function public.save_article(uuid,uuid,int,jsonb) to authenticated;

create function private.submit_article(p_id uuid,p_revision uuid,p_version int,p_reviewer uuid,p_deadline timestamptz,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare a private.articles:=private.editable_article(p_id); r private.article_revisions; qid uuid; round_number int;
begin
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
revoke all on function private.submit_article(uuid,uuid,int,uuid,timestamptz,text) from public,anon;
grant execute on function private.submit_article(uuid,uuid,int,uuid,timestamptz,text) to authenticated;
create function public.submit_article(p_id uuid,p_revision uuid,p_version int,p_reviewer uuid,p_deadline timestamptz default null,p_note text default '') returns uuid language sql security invoker set search_path='' as $$select private.submit_article(p_id,p_revision,p_version,p_reviewer,p_deadline,p_note)$$;
grant execute on function public.submit_article(uuid,uuid,int,uuid,timestamptz,text) to authenticated;

create function private.review_queue() returns table(id uuid,article_id uuid,revision_id uuid,title text,excerpt text,type text,writer_name text,round int,state text,decision text,needed_by timestamptz,note text,created_at timestamptz)
 language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['reviewer']);
 return query select q.id,q.article_id,q.revision_id,r.title,r.excerpt,r.type,p.full_name,q.round,q.state,q.decision,q.needed_by,q.note,q.created_at
 from private.review_assignments q join private.article_revisions r on r.id=q.revision_id join private.articles a on a.id=q.article_id join public.profiles p on p.id=a.owner_id
 where q.reviewer_id=auth.uid() and q.state in ('invited','accepted','decided') and a.deleted_at is null
 order by q.needed_by asc nulls last,q.created_at,q.id limit 200;
end $$;
revoke all on function private.review_queue() from public,anon;
grant execute on function private.review_queue() to authenticated;
create function public.review_queue() returns table(id uuid,article_id uuid,revision_id uuid,title text,excerpt text,type text,writer_name text,round int,state text,decision text,needed_by timestamptz,note text,created_at timestamptz)
 language sql stable security invoker set search_path='' as $$select * from private.review_queue()$$;
grant execute on function public.review_queue() to authenticated;

create function private.review_action(p_id uuid,p_action text,p_note text,p_requests text[]) returns void language plpgsql security definer set search_path='' as $$
declare q private.review_assignments; a private.articles; r private.article_revisions; request_text text; actor uuid;
begin
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
revoke all on function private.review_action(uuid,text,text,text[]) from public,anon;
grant execute on function private.review_action(uuid,text,text,text[]) to authenticated;
create function public.review_action(p_id uuid,p_action text,p_note text default '',p_requests text[] default '{}') returns void language sql security invoker set search_path='' as $$select private.review_action(p_id,p_action,p_note,p_requests)$$;
grant execute on function public.review_action(uuid,text,text,text[]) to authenticated;

create function private.publish_revision(p_id uuid,p_revision uuid) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles; r private.article_revisions; reviewer uuid;
begin
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
revoke all on function private.publish_revision(uuid,uuid) from public,anon,authenticated;
create function private.publish_article(p_id uuid,p_revision uuid,p_schedule timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare a private.articles:=private.editable_article(p_id);
begin
 if a.published_revision_id=p_revision and a.status='published' and a.visibility='public' then return; end if;
 if a.working_revision_id is distinct from p_revision or a.status<>'approved' or a.visibility='withdrawn' then raise exception 'Approve the current revision before publishing.' using errcode='23514'; end if;
 if p_schedule is not null and p_schedule>clock_timestamp() then
  if exists(select 1 from private.article_revisions where id=p_revision and display_until<=p_schedule) then raise exception 'Expiry precedes publication.' using errcode='23514'; end if;
  update private.articles set scheduled_at=p_schedule,updated_at=clock_timestamp() where id=p_id;
  perform private.audit('articles','scheduled',p_id::text,null,jsonb_build_object('scheduled_at',p_schedule));
 else perform private.publish_revision(p_id,p_revision); end if;
end $$;
revoke all on function private.publish_article(uuid,uuid,timestamptz) from public,anon;
grant execute on function private.publish_article(uuid,uuid,timestamptz) to authenticated;
create function public.publish_article(p_id uuid,p_revision uuid,p_schedule timestamptz default null) returns void language sql security invoker set search_path='' as $$select private.publish_article(p_id,p_revision,p_schedule)$$;
grant execute on function public.publish_article(uuid,uuid,timestamptz) to authenticated;
