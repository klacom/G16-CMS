-- Bounded read models use the same caller permissions as their destination lists.
create function public.public_anniversaries(p_day date) returns setof public.public_articles
 language sql stable security invoker set search_path='' as $$
 select a.* from public.public_articles a
 where extract(year from a.first_published_at at time zone 'Asia/Manila')<extract(year from p_day)
 and to_char(a.first_published_at at time zone 'Asia/Manila','MM-DD')=to_char(p_day,'MM-DD')
 order by a.first_published_at desc,a.id limit 3
$$;
grant execute on function public.public_anniversaries(date) to anon,authenticated;

create function private.normalize_revision_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if new.type<>'announcement' then new.display_until:=null;end if;
 if new.type<>'event' then new.event_starts_at:=null;new.event_ends_at:=null;new.venue:=null;new.map_url:=null;end if;
 return new;
end $$;
revoke all on function private.normalize_revision_fields() from public,anon,authenticated;
create trigger normalize_revision_fields before insert or update on private.article_revisions for each row execute function private.normalize_revision_fields();

create or replace function private.save_preferences(p_preferences jsonb) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor();
begin
 if p_preferences is null or jsonb_typeof(p_preferences)<>'object' or exists(select 1 from jsonb_each(p_preferences) x where jsonb_typeof(x.value)<>'boolean' or x.key not in
 ('review_requested','review_accepted','changes_requested','resubmitted','approved','published','invite_accepted','invite_expired','contact_messages','reviewer_stepped_down','goes_live_soon')) then
  raise exception 'Invalid notification preference.' using errcode='23514';end if;
 insert into public.notification_preferences(user_id,email_preferences) values(actor,p_preferences)
 on conflict(user_id) do update set email_preferences=public.notification_preferences.email_preferences||excluded.email_preferences;
end $$;

create function private.review_page(p_page int,p_history boolean,p_id uuid)
 returns table(id uuid,article_id uuid,revision_id uuid,title text,excerpt text,type text,writer_name text,round int,state text,decision text,needed_by timestamptz,note text,created_at timestamptz)
 language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['reviewer']);
 if p_page is null or p_page not between 1 and 10000 or p_history is null then raise exception 'Invalid review page.' using errcode='23514';end if;
 return query select q.id,q.article_id,q.revision_id,r.title,r.excerpt,r.type,p.full_name,q.round,q.state,q.decision,q.needed_by,q.note,q.created_at
 from private.review_assignments q join private.article_revisions r on r.id=q.revision_id join private.articles a on a.id=q.article_id join public.profiles p on p.id=a.owner_id
 where q.reviewer_id=auth.uid() and a.deleted_at is null
 and ((p_id is not null and q.id=p_id and q.state in ('invited','accepted','decided')) or
 (p_id is null and ((p_history and q.state='decided') or (not p_history and q.state in ('invited','accepted')))))
 order by case when p_history then null else q.needed_by end asc nulls last,q.created_at desc,q.id
 limit 40 offset case when p_id is null then (p_page-1)*40 else 0 end;
end $$;
revoke all on function private.review_page(int,boolean,uuid) from public,anon;
grant execute on function private.review_page(int,boolean,uuid) to authenticated;
create function public.review_page(p_page int default 1,p_history boolean default false,p_id uuid default null)
 returns table(id uuid,article_id uuid,revision_id uuid,title text,excerpt text,type text,writer_name text,round int,state text,decision text,needed_by timestamptz,note text,created_at timestamptz)
 language sql stable security invoker set search_path='' as $$select * from private.review_page(p_page,p_history,p_id)$$;
grant execute on function public.review_page(int,boolean,uuid) to authenticated;

create function public.desk_counts() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 perform private.require_actor(array['writer','admin']);
 return (select jsonb_object_agg(s,n) from (select status s,count(*) n from public.desk_article_list group by status) counts);
end $$;
grant execute on function public.desk_counts() to authenticated;

create function private.review_counts() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_actor(array['reviewer']);
 return (select jsonb_build_object('waiting',count(*),'invitations',count(*) filter(where q.state='invited'),'overdue',count(*) filter(where q.needed_by<now()))
 from private.review_assignments q join private.articles a on a.id=q.article_id where q.reviewer_id=auth.uid() and q.state in ('invited','accepted') and a.deleted_at is null);
end $$;
revoke all on function private.review_counts() from public,anon;
grant execute on function private.review_counts() to authenticated;
create function public.review_counts() returns jsonb language sql stable security invoker set search_path='' as $$select private.review_counts()$$;
grant execute on function public.review_counts() to authenticated;

create function private.export_audit(p_from timestamptz,p_to timestamptz,p_area text,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb;total int;
begin
 perform private.require_actor(array['admin']);
 if p_from is null or p_to is null or p_to<=p_from or p_to-p_from>interval '366 days' or char_length(p_area)>40 or char_length(p_action)>80 then raise exception 'Narrow the export range.' using errcode='23514';end if;
 select coalesce(jsonb_agg(to_jsonb(e)),'[]') into rows from
 (select * from public.audit_entries where created_at>=p_from and created_at<p_to and (coalesce(p_area,'')='' or area=p_area) and (coalesce(p_action,'')='' or action=p_action)
 order by created_at desc,id desc limit 10001) e;
 total:=jsonb_array_length(rows);
 if total>10000 then raise exception 'Narrow the export to 10,000 entries or fewer.' using errcode='23514';end if;
 perform private.audit('security','audit_exported',null,null,jsonb_build_object('from',p_from,'to',p_to,'count',total));
 return rows;
end $$;
revoke all on function private.export_audit(timestamptz,timestamptz,text,text) from public,anon;
grant execute on function private.export_audit(timestamptz,timestamptz,text,text) to authenticated;
create function public.export_audit(p_from timestamptz,p_to timestamptz,p_area text default '',p_action text default '') returns jsonb language sql security invoker set search_path='' as $$select private.export_audit(p_from,p_to,p_area,p_action)$$;
grant execute on function public.export_audit(timestamptz,timestamptz,text,text) to authenticated;
notify pgrst,'reload schema';

create function private.desk_month(p_month date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.require_actor();actor_role text:=private.actor_role();first_day date:=date_trunc('month',p_month)::date;last_day date:=(date_trunc('month',p_month)+interval '1 month')::date;
begin
 if p_month is null then raise exception 'Choose a month.' using errcode='23514';end if;
 return (with items as (
  select (q.needed_by at time zone 'Asia/Manila')::date as item_day,q.needed_by as item_at,q.id,r.title,'Review due' kind,'/dashboard/reviews/'||q.id href
  from private.review_assignments q join private.article_revisions r on r.id=q.revision_id join private.articles a on a.id=q.article_id
  where actor_role='reviewer' and q.reviewer_id=actor and q.state in ('invited','accepted') and a.deleted_at is null and q.needed_by>=first_day::timestamp at time zone 'Asia/Manila' and q.needed_by<last_day::timestamp at time zone 'Asia/Manila'
  union all
  select (a.scheduled_at at time zone 'Asia/Manila')::date,a.scheduled_at,a.id,r.title,'Publication','/dashboard/articles/'||a.id||'/edit'
  from private.articles a join private.article_revisions r on r.id=a.working_revision_id
  where actor_role in ('writer','admin') and (actor_role='admin' or a.owner_id=actor) and a.deleted_at is null and a.scheduled_at>=first_day::timestamp at time zone 'Asia/Manila' and a.scheduled_at<last_day::timestamp at time zone 'Asia/Manila'
  union all
  select d::date,r.event_starts_at,a.id,r.title,'Event','/dashboard/articles/'||a.id||'/edit'
  from private.articles a join private.article_revisions r on r.id=a.working_revision_id
  cross join lateral generate_series(greatest(first_day,(r.event_starts_at at time zone 'Asia/Manila')::date)::timestamp,
    least(last_day-1,((coalesce(r.event_ends_at,r.event_starts_at+interval '1 microsecond')-interval '1 microsecond') at time zone 'Asia/Manila')::date)::timestamp,interval '1 day') d
  where actor_role in ('writer','admin') and (actor_role='admin' or a.owner_id=actor) and a.deleted_at is null and r.type='event' and a.visibility not in ('archived','withdrawn')
 ),ranked as(select *,count(*) over(partition by item_day) total,row_number() over(partition by item_day order by item_at,id,kind) position from items),grouped as(
 select item_day,max(total) total,jsonb_agg(jsonb_build_object('id',id,'title',title,'at',item_at,'kind',kind,'href',href) order by item_at,id,kind) items from ranked where position<=5 group by item_day)
 select coalesce(jsonb_agg(jsonb_build_object('day',g.item_day,'total',g.total,'items',g.items) order by g.item_day),'[]') from grouped g);
end $$;
revoke all on function private.desk_month(date) from public,anon;
grant execute on function private.desk_month(date) to authenticated;
create function public.desk_month(p_month date) returns jsonb language sql stable security invoker set search_path='' as $$select private.desk_month(p_month)$$;
grant execute on function public.desk_month(date) to authenticated;
notify pgrst,'reload schema';
