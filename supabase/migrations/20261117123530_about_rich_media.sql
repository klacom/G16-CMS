-- About shares the editor's allowlisted content and private media transport.
alter table private.media_assets drop constraint media_assets_purpose_check;
alter table private.media_assets add constraint media_assets_purpose_check check(purpose in ('article','avatar','about'));

create or replace function private.reserve_media(p_article uuid,p_type text,p_bytes int,p_purpose text) returns table(id uuid,object_path text) language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.require_actor(); asset_id uuid:=gen_random_uuid(); path text; a private.articles;
begin
 if p_purpose='article' then a:=private.editable_article(p_article);
 elsif p_purpose='about' then perform private.require_actor(array['admin']);
 elsif p_purpose<>'avatar' then raise exception 'Invalid upload purpose.' using errcode='23514'; end if;
 if p_type not in ('image/jpeg','image/png','image/webp') or p_bytes not between 1 and 4194304 then raise exception 'Upload a JPG, PNG or WebP up to 4 MB.' using errcode='23514'; end if;
 if (select count(*) from private.media_assets where owner_id=actor and state='pending' and created_at>now()-interval '1 hour')>=50 then raise exception 'Finish existing uploads before uploading more.' using errcode='23514'; end if;
 path:=case p_purpose when 'avatar' then 'avatars/'||actor when 'about' then 'about/'||actor else 'articles/'||a.id end||'/'||asset_id||case p_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end;
 insert into private.media_assets(id,owner_id,article_id,purpose,object_path,content_type,bytes)
 values(asset_id,actor,case when p_purpose='article' then a.id else null end,p_purpose,path,p_type,p_bytes);
 return query select asset_id,path;
end $$;

create or replace function private.media_location(p_id uuid) returns table(object_path text,content_type text,bytes integer) language plpgsql stable security definer set search_path='' as $$
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
 if not permitted and asset.purpose='about' then
  permitted:=exists(select 1 from private.about_sections s cross join lateral jsonb_path_query(s.body,'$.** ? (@.type == "image").attrs.src') src where src#>>'{}'='/media/'||asset.id);
 end if;
 if permitted then return query select asset.object_path,asset.content_type,asset.bytes; end if;
end $$;

create or replace function private.save_about(p_key text,p_heading text,p_body jsonb,p_position int) returns void language plpgsql security definer set search_path='' as $$
declare body_plain text;
begin
 perform private.require_actor(array['admin']);
 if p_body->>'type'<>'doc' or not private.valid_rich_node(p_body) or octet_length(p_body::text)>100000 then raise exception 'Unsupported About content.' using errcode='23514'; end if;
 if exists(select 1 from jsonb_path_query(p_body,'$.** ? (@.type == "image")') img where
 char_length(trim(coalesce(img#>>'{attrs,alt}',''))) not between 1 and 300 or not exists(select 1 from private.media_assets m where '/media/'||m.id=img#>>'{attrs,src}' and m.purpose='about' and m.state='ready')) then raise exception 'Use a verified About image with alternative text.' using errcode='23514';end if;
 body_plain:=coalesce((select string_agg(x#>>'{}',' ') from jsonb_path_query(p_body,'$.** ? (@.type == "text").text') x),'');
 insert into private.about_sections(key,position,heading,body,body_text) values(p_key,case p_key when 'introduction' then 0 when 'call-to-action' then 9999 else greatest(1,least(9998,p_position)) end,trim(p_heading),p_body,body_plain)
 on conflict(key) do update set position=excluded.position,heading=excluded.heading,body=excluded.body,body_text=excluded.body_text;
 perform private.audit('settings','about_updated',p_key,p_heading,jsonb_build_object('content','edited'));
end $$;
notify pgrst,'reload schema';
