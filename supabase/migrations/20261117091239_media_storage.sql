insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('icg-media','icg-media',false,4194304,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=false,file_size_limit=4194304,allowed_mime_types=excluded.allowed_mime_types;
create table private.media_assets (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id),article_id uuid references private.articles(id),
 purpose text not null check(purpose in ('article','avatar')),object_path text not null unique,
 content_type text not null check(content_type in ('image/jpeg','image/png','image/webp')),bytes int not null check(bytes between 1 and 4194304),
 state text not null default 'pending' check(state in ('pending','ready')),created_at timestamptz not null default now()
);
create index media_article on private.media_assets(article_id);
create index media_owner on private.media_assets(owner_id);
alter table private.media_assets enable row level security;
grant select on private.media_assets to authenticated;
grant all on private.media_assets to service_role;
create policy media_owner_read on private.media_assets for select to authenticated using((select private.actor_role()) is not null and (owner_id=(select auth.uid()) or (select private.actor_role())='admin'));
create view public.media_assets with(security_invoker=true) as select id,owner_id,article_id,purpose,state,content_type,bytes,created_at from private.media_assets;
grant select on public.media_assets to authenticated;

create function private.revision_has_media(r private.article_revisions,p_id uuid) returns boolean language sql immutable set search_path='' as $$
 select r.images @> jsonb_build_array(jsonb_build_object('id',p_id::text)) or exists(select 1 from jsonb_path_query(r.body,'$.** ? (@.type == "image").attrs.src') x where x#>>'{}'='/media/'||p_id)
$$;
revoke all on function private.revision_has_media(private.article_revisions,uuid) from public,anon,authenticated;
create function private.media_location(p_id uuid) returns table(object_path text,content_type text,bytes integer) language plpgsql stable security definer set search_path='' as $$
declare asset private.media_assets; permitted boolean:=false;
begin
 select * into asset from private.media_assets where id=p_id and state='ready';
 if asset.id is null then return; end if;
 if auth.uid() is not null and private.actor_role() is not null then
  permitted:=asset.owner_id=auth.uid() or private.actor_role()='admin';
  if not permitted and asset.article_id is not null then
   permitted:=exists(select 1 from private.article_revisions r where r.article_id=asset.article_id and private.can_read_revision(r.id) and private.revision_has_media(r,asset.id));
  end if;
 end if;
 if not permitted and asset.purpose='article' then
  permitted:=exists(select 1 from private.articles a join private.article_revisions r on r.id=a.published_revision_id
    where a.id=asset.article_id and a.visibility in ('public','archived') and a.published_at<=now() and a.deleted_at is null and private.revision_has_media(r,asset.id));
 end if;
 if permitted then return query select asset.object_path,asset.content_type,asset.bytes; end if;
end $$;
revoke all on function private.media_location(uuid) from public;
grant execute on function private.media_location(uuid) to anon,authenticated;
create function public.media_location(p_id uuid) returns table(object_path text,content_type text,bytes integer) language sql stable security invoker set search_path='' as $$select * from private.media_location(p_id)$$;
grant execute on function public.media_location(uuid) to anon,authenticated;

create function private.reserve_media(p_article uuid,p_type text,p_bytes int,p_purpose text) returns table(id uuid,object_path text) language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(); asset_id uuid:=gen_random_uuid(); path text; a private.articles;
begin
 if p_purpose='article' then a:=private.editable_article(p_article);
 elsif p_purpose<>'avatar' then raise exception 'Invalid upload purpose.' using errcode='23514'; end if;
 if p_type not in ('image/jpeg','image/png','image/webp') or p_bytes not between 1 and 4194304 then raise exception 'Upload a JPG, PNG or WebP up to 4 MB.' using errcode='23514'; end if;
 if (select count(*) from private.media_assets where owner_id=actor and state='pending' and created_at>now()-interval '1 hour')>=50 then raise exception 'Finish existing uploads before uploading more.' using errcode='23514'; end if;
 path:=case when p_purpose='avatar' then 'avatars/'||actor else 'articles/'||a.id end||'/'||asset_id||case p_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end;
 insert into private.media_assets(id,owner_id,article_id,purpose,object_path,content_type,bytes)
 values(asset_id,actor,case when p_purpose='article' then a.id else null end,p_purpose,path,p_type,p_bytes);
 return query select asset_id,path;
end $$;
revoke all on function private.reserve_media(uuid,text,int,text) from public,anon;
grant execute on function private.reserve_media(uuid,text,int,text) to authenticated;
create function public.reserve_media(p_type text,p_bytes int,p_purpose text,p_article uuid default null) returns table(id uuid,object_path text) language sql security invoker set search_path='' as $$select * from private.reserve_media(p_article,p_type,p_bytes,p_purpose)$$;
grant execute on function public.reserve_media(text,int,text,uuid) to authenticated;

create function private.may_upload_media(path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.actor_role() is not null and exists(select 1 from private.media_assets m where m.object_path=path and m.owner_id=auth.uid() and m.state='pending'
 and (m.purpose='avatar' or private.actor_role()='admin' or exists(select 1 from private.articles a where a.id=m.article_id and a.owner_id=auth.uid() and private.actor_role()='writer')))
$$;
revoke all on function private.may_upload_media(text) from public,anon;
grant execute on function private.may_upload_media(text) to authenticated;
create policy icg_upload on storage.objects for insert to authenticated with check(bucket_id='icg-media' and private.may_upload_media(name));
-- No client SELECT/UPDATE/DELETE policy: this prevents clients minting signed
-- download capabilities that would remain valid after withdrawal/deactivation.
create function private.complete_media(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(); m private.media_assets;
begin
 select * into m from private.media_assets where id=p_id and owner_id=actor for update;
 if m.id is null then raise exception 'Upload unavailable.' using errcode='42501'; end if;
 if m.state='ready' then return; end if;
 if not exists(select 1 from storage.objects where bucket_id='icg-media' and name=m.object_path and (metadata->>'size')::bigint=m.bytes and metadata->>'mimetype'=m.content_type) then raise exception 'The uploaded file could not be verified.' using errcode='23514'; end if;
 update private.media_assets set state='ready' where id=m.id;
 if m.purpose='avatar' then update public.profiles set avatar_path=m.id::text where id=actor; end if;
 perform private.audit('articles','media_uploaded',coalesce(m.article_id,actor)::text,null,jsonb_build_object('media_id',m.id));
end $$;
revoke all on function private.complete_media(uuid) from public,anon;
grant execute on function private.complete_media(uuid) to authenticated;
create function public.complete_media(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.complete_media(p_id)$$;
grant execute on function public.complete_media(uuid) to authenticated;

create function private.validate_revision_media() returns trigger language plpgsql set search_path='' as $$
declare image jsonb; src jsonb; media_id uuid;
begin
 if jsonb_typeof(new.images)<>'array' then raise exception 'Invalid gallery.' using errcode='23514'; end if;
 if (select count(*) from jsonb_array_elements(new.images) i where (i->>'cover')::boolean)>1 then raise exception 'Choose one cover.' using errcode='23514'; end if;
 for image in select * from jsonb_array_elements(new.images) loop
  media_id:=nullif(image->>'id','')::uuid;
  if media_id is null or char_length(trim(coalesce(image->>'alt',''))) not between 1 and 300 or char_length(coalesce(image->>'credit',''))>200 or char_length(coalesce(image->>'caption',''))>500
   or not exists(select 1 from private.media_assets where id=media_id and article_id=new.article_id and purpose='article' and state='ready') then raise exception 'Use a verified article image with alternative text.' using errcode='23514'; end if;
 end loop;
 for src in select * from jsonb_path_query(new.body,'$.** ? (@.type == "image")') loop
  media_id:=replace(src#>>'{attrs,src}','/media/','')::uuid;
  if char_length(trim(coalesce(src#>>'{attrs,alt}',''))) not between 1 and 300 or not exists(select 1 from private.media_assets where id=media_id and article_id=new.article_id and purpose='article' and state='ready') then raise exception 'Use a verified inline image with alternative text.' using errcode='23514'; end if;
 end loop;
 return new;
end $$;
revoke all on function private.validate_revision_media() from public,anon,authenticated;
create trigger validate_revision_media before insert or update of body,images on private.article_revisions for each row execute function private.validate_revision_media();
