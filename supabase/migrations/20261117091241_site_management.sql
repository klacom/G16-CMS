create table private.site_settings(singleton boolean primary key default true check(singleton),public_details jsonb not null default '{"reply_within_school_days":2}',updated_at timestamptz not null default now());
insert into private.site_settings(singleton) values(true);
create table private.about_sections(key text primary key check(key~'^[a-z][a-z0-9-]{1,60}$'),position int not null check(position between 0 and 9999),heading text not null check(char_length(heading)<=160),body jsonb not null,body_text text not null default '');
create table private.featured_stories(position int primary key check(position between 1 and 3),article_id uuid not null unique references private.articles(id));
create table private.tags(name text primary key check(char_length(name) between 1 and 48),archived_at timestamptz);
alter table private.site_settings enable row level security;
alter table private.about_sections enable row level security;
alter table private.featured_stories enable row level security;
alter table private.tags enable row level security;
grant select on private.site_settings,private.about_sections,private.featured_stories,private.tags to anon,authenticated;
grant all on private.site_settings,private.about_sections,private.featured_stories,private.tags to service_role;
create policy settings_read on private.site_settings for select to anon,authenticated using(true);
create policy about_read on private.about_sections for select to anon,authenticated using(true);
create policy featured_read on private.featured_stories for select to anon,authenticated using(exists(select 1 from public.public_articles a where a.id=article_id and a.visibility='public' and (a.display_until is null or a.display_until>now())));
create policy tags_public_read on private.tags for select to anon,authenticated using(exists(select 1 from public.public_articles a where private.tags.name=any(a.tags)));
create policy tags_desk_read on private.tags for select to authenticated using((select private.actor_role())='admin' or exists(select 1 from private.article_revisions r where private.tags.name=any(r.tags) and private.can_read_revision(r.id)));
create view public.site_settings with(security_invoker=true) as select public_details,updated_at from private.site_settings;
create view public.about_sections with(security_invoker=true) as select * from private.about_sections;
create view public.featured_stories with(security_invoker=true) as select * from private.featured_stories;
create view public.tags with(security_invoker=true) as select * from private.tags;
grant select on public.site_settings,public.about_sections,public.featured_stories,public.tags to anon,authenticated;

create function private.save_site_settings(p_details jsonb) returns void language plpgsql security definer set search_path='' as $$
declare key text; value jsonb; text_value text;
begin
 perform private.require_actor(array['admin']);
 if jsonb_typeof(p_details)<>'object' then raise exception 'Invalid settings.' using errcode='23514'; end if;
 for key,value in select * from jsonb_each(p_details) loop
  if key not in ('office_address','office_hours','office_hours_note','contact_email','events_email','phone','reply_within_school_days','facebook_url','instagram_url','youtube_url','tiktok_url') then raise exception 'Unknown setting.' using errcode='23514'; end if;
  text_value:=value#>>'{}';
  if key='reply_within_school_days' then
   if text_value not in ('1','2','3','5') then raise exception 'Invalid turnaround.' using errcode='23514'; end if;
  elsif jsonb_typeof(value)<>'string' or char_length(text_value)>1000 then raise exception 'Invalid setting value.' using errcode='23514'; end if;
  if key like '%_url' and text_value<>'' and text_value!~('^https://(www\.)?'||case key when 'facebook_url' then 'facebook\.com' when 'instagram_url' then 'instagram\.com' when 'youtube_url' then 'youtube\.com' else 'tiktok\.com' end||'/') then raise exception 'Use the social network official HTTPS URL.' using errcode='23514'; end if;
  if key like '%_email' and text_value<>'' and (char_length(text_value)>254 or text_value not like '%@%') then raise exception 'Invalid contact email.' using errcode='23514'; end if;
 end loop;
 update private.site_settings set public_details=public_details||p_details,updated_at=now() where singleton;
 perform private.audit('settings','public_settings_updated',null,null,jsonb_build_object('fields',array(select jsonb_object_keys(p_details))));
end $$;
revoke all on function private.save_site_settings(jsonb) from public,anon;
grant execute on function private.save_site_settings(jsonb) to authenticated;
create function public.save_site_settings(p_details jsonb) returns void language sql security invoker set search_path='' as $$select private.save_site_settings(p_details)$$;
grant execute on function public.save_site_settings(jsonb) to authenticated;

create function private.save_category(p_id uuid,p_name text,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare category private.categories; slug_value text;
begin
 perform private.require_actor(array['admin']);
 if p_id is null then
  slug_value:=trim(both '-' from regexp_replace(lower(trim(p_name)),'[^a-z0-9]+','-','g'));
  insert into private.categories(name,slug) values(trim(p_name),slug_value);
 else
  select * into category from private.categories where id=p_id for update;
  if category.id is null then raise exception 'Category unavailable.' using errcode='P0002'; end if;
  if p_action='delete' and not exists(select 1 from private.article_revisions where category_id=p_id) then delete from private.categories where id=p_id;
  elsif p_action in ('delete','archive') then update private.categories set archived_at=now() where id=p_id;
  elsif p_action='restore' then update private.categories set archived_at=null where id=p_id;
  elsif p_action='save' then update private.categories set name=trim(p_name) where id=p_id;
  else raise exception 'Invalid category action.' using errcode='23514'; end if;
 end if;
 perform private.audit('settings','category_'||p_action,p_id::text,p_name);
end $$;
revoke all on function private.save_category(uuid,text,text) from public,anon;
grant execute on function private.save_category(uuid,text,text) to authenticated;
create function public.save_category(p_name text,p_action text default 'save',p_id uuid default null) returns void language sql security invoker set search_path='' as $$select private.save_category(p_id,p_name,p_action)$$;
grant execute on function public.save_category(text,text,uuid) to authenticated;

create function private.save_about(p_key text,p_heading text,p_body jsonb,p_position int) returns void language plpgsql security definer set search_path='' as $$
declare body_plain text;
begin
 perform private.require_actor(array['admin']);
 if p_body->>'type'<>'doc' or not private.valid_rich_node(p_body) or octet_length(p_body::text)>100000 then raise exception 'Unsupported About content.' using errcode='23514'; end if;
 -- About is text and links; image/video publication uses editorial revisions.
 if exists(select 1 from jsonb_path_query(p_body,'$.**.type') t where t#>>'{}' in ('image','video')) then raise exception 'About sections support text and links.' using errcode='23514'; end if;
 body_plain:=coalesce((select string_agg(x#>>'{}',' ') from jsonb_path_query(p_body,'$.** ? (@.type == "text").text') x),'');
 insert into private.about_sections(key,position,heading,body,body_text) values(p_key,case p_key when 'introduction' then 0 when 'call-to-action' then 9999 else greatest(1,least(9998,p_position)) end,trim(p_heading),p_body,body_plain)
 on conflict(key) do update set position=excluded.position,heading=excluded.heading,body=excluded.body,body_text=excluded.body_text;
 perform private.audit('settings','about_updated',p_key,p_heading,jsonb_build_object('content','edited'));
end $$;
revoke all on function private.save_about(text,text,jsonb,int) from public,anon;
grant execute on function private.save_about(text,text,jsonb,int) to authenticated;
create function public.save_about(p_key text,p_heading text,p_body jsonb,p_position int default 1) returns void language sql security invoker set search_path='' as $$select private.save_about(p_key,p_heading,p_body,p_position)$$;
grant execute on function public.save_about(text,text,jsonb,int) to authenticated;

create function private.set_featured(p_position int,p_article uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_actor(array['admin']);
 if p_position not between 1 and 3 then raise exception 'Choose one of three featured places.' using errcode='23514'; end if;
 if p_article is null then delete from private.featured_stories where position=p_position;
 elsif exists(select 1 from public.public_articles where id=p_article and visibility='public' and (display_until is null or display_until>now())) then
  insert into private.featured_stories(position,article_id) values(p_position,p_article) on conflict(position) do update set article_id=excluded.article_id;
 else raise exception 'Choose an eligible public article.' using errcode='23514'; end if;
 perform private.audit('settings','featured_updated',p_article::text,null,jsonb_build_object('position',p_position));
end $$;
revoke all on function private.set_featured(int,uuid) from public,anon;
grant execute on function private.set_featured(int,uuid) to authenticated;
create function public.set_featured(p_position int,p_article uuid default null) returns void language sql security invoker set search_path='' as $$select private.set_featured(p_position,p_article)$$;
grant execute on function public.set_featured(int,uuid) to authenticated;

create function private.register_tags() returns trigger language plpgsql set search_path='' as $$
declare tag text;
begin
 new.tags:=array(select distinct lower(trim(t)) from unnest(new.tags) t);
 foreach tag in array new.tags loop
  if exists(select 1 from private.tags where name=tag and archived_at is not null) then raise exception 'Choose active tags.' using errcode='23514'; end if;
  insert into private.tags(name) values(tag) on conflict(name) do nothing;
 end loop;
 return new;
end $$;
revoke all on function private.register_tags() from public,anon,authenticated;
create trigger register_tags before insert or update of tags on private.article_revisions for each row execute function private.register_tags();
