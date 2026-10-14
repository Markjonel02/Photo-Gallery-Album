-- Aura Gallery — initial schema, RLS and storage policies.
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ───────────────────────────── Extensions ─────────────────────────────
create extension if not exists pg_trgm;

-- ───────────────────────────── Tables ─────────────────────────────────
create table if not exists public.albums (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 60),
  description      text not null default '' check (char_length(description) <= 200),
  cover_photo_path text,
  sort_order       bigint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.photos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  album_id        uuid,
  storage_path    text not null unique,
  title           text not null check (char_length(title) between 1 and 80),
  description     text check (description is null or char_length(description) <= 500),
  category        text not null default 'minimal'
                  check (category in ('nature','architecture','travel','street','portraits','minimal')),
  tags            text[] not null default '{}' check (cardinality(tags) <= 10),
  is_favorite     boolean not null default false,
  sort_order      bigint not null default 0,
  location        text check (location is null or char_length(location) <= 80),
  taken_at        timestamptz not null default now(),
  camera          text check (camera is null or char_length(camera) <= 80),
  lens            text check (lens is null or char_length(lens) <= 80),
  focal_length    text check (focal_length is null or char_length(focal_length) <= 20),
  aperture        text check (aperture is null or char_length(aperture) <= 20),
  iso             integer check (iso is null or iso between 1 and 10000000),
  shutter_speed   text check (shutter_speed is null or char_length(shutter_speed) <= 20),
  width           integer check (width is null or width > 0),
  height          integer check (height is null or height > 0),
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  search_text     text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- a photo can only live in an album owned by the same user
  constraint photos_album_owner_fk foreign key (album_id, user_id)
    references public.albums (id, user_id) on delete set null (album_id),
  -- storage objects must live under the owner's folder
  constraint photos_path_owner_chk check (storage_path like user_id::text || '/%')
);

create index if not exists photos_user_sort_idx on public.photos (user_id, sort_order);
create index if not exists photos_user_album_idx on public.photos (user_id, album_id);
create index if not exists photos_user_fav_idx on public.photos (user_id) where is_favorite;
create index if not exists photos_search_trgm_idx on public.photos using gin (search_text gin_trgm_ops);
create index if not exists albums_user_sort_idx on public.albums (user_id, sort_order);

-- ───────────────────────────── Triggers ───────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- New rows go to the top of the user's arrangement.
create or replace function public.set_sort_order_on_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'photos' then
    select coalesce(min(sort_order), 0) - 1 into new.sort_order from public.photos where user_id = new.user_id;
  else
    select coalesce(min(sort_order), 0) - 1 into new.sort_order from public.albums where user_id = new.user_id;
  end if;
  return new;
end $$;

create or replace function public.build_photo_search_text() returns trigger
language plpgsql as $$
begin
  new.search_text = lower(
    coalesce(new.title, '') || ' ' || coalesce(new.camera, '') || ' ' ||
    coalesce(new.location, '') || ' ' || coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end $$;

create or replace function public.refresh_album_cover(p_album uuid) returns void
language sql set search_path = public as $$
  update public.albums a
     set cover_photo_path = (
       select p.storage_path from public.photos p
        where p.album_id = a.id order by p.sort_order asc limit 1)
   where a.id = p_album;
$$;

create or replace function public.photos_sync_album_cover() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.album_id is not null then
    perform public.refresh_album_cover(old.album_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.album_id is not null then
    perform public.refresh_album_cover(new.album_id);
  end if;
  return null;
end $$;

drop trigger if exists photos_touch on public.photos;
create trigger photos_touch before update on public.photos
  for each row execute function public.touch_updated_at();
drop trigger if exists albums_touch on public.albums;
create trigger albums_touch before update on public.albums
  for each row execute function public.touch_updated_at();

drop trigger if exists photos_sort on public.photos;
create trigger photos_sort before insert on public.photos
  for each row execute function public.set_sort_order_on_insert();
drop trigger if exists albums_sort on public.albums;
create trigger albums_sort before insert on public.albums
  for each row execute function public.set_sort_order_on_insert();

drop trigger if exists photos_search on public.photos;
create trigger photos_search before insert or update of title, camera, location, tags on public.photos
  for each row execute function public.build_photo_search_text();

drop trigger if exists photos_cover on public.photos;
create trigger photos_cover after insert or delete or update of album_id, sort_order on public.photos
  for each row execute function public.photos_sync_album_cover();

-- ───────────────────────────── RLS ────────────────────────────────────
alter table public.albums enable row level security;
alter table public.photos enable row level security;

drop policy if exists albums_owner_all on public.albums;
create policy albums_owner_all on public.albums
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists photos_owner_all on public.photos;
create policy photos_owner_all on public.photos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.albums, public.photos from anon;

-- ───────────────────────────── RPCs ───────────────────────────────────
-- Re-assigns the *existing* sort slots of the given rows to the new order, so it
-- works for any subset (filtered or paginated lists) without disturbing the rest.
create or replace function public.reorder_photos(p_ids uuid[]) returns void
language plpgsql security invoker set search_path = public as $$
declare slots bigint[];
begin
  select array_agg(sort_order order by sort_order) into slots
    from public.photos where id = any (p_ids) and user_id = auth.uid();
  if coalesce(array_length(slots, 1), 0) <> coalesce(array_length(p_ids, 1), 0) then
    raise exception 'invalid photo ids';
  end if;
  update public.photos p set sort_order = slots[t.ord]
    from unnest(p_ids) with ordinality as t (id, ord)
   where p.id = t.id and p.user_id = auth.uid();
end $$;

create or replace function public.reorder_albums(p_ids uuid[]) returns void
language plpgsql security invoker set search_path = public as $$
declare slots bigint[];
begin
  select array_agg(sort_order order by sort_order) into slots
    from public.albums where id = any (p_ids) and user_id = auth.uid();
  if coalesce(array_length(slots, 1), 0) <> coalesce(array_length(p_ids, 1), 0) then
    raise exception 'invalid album ids';
  end if;
  update public.albums a set sort_order = slots[t.ord]
    from unnest(p_ids) with ordinality as t (id, ord)
   where a.id = t.id and a.user_id = auth.uid();
end $$;

create or replace function public.library_stats() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'total',     (select count(*) from public.photos where user_id = auth.uid()),
    'favorites', (select count(*) from public.photos where user_id = auth.uid() and is_favorite),
    'categories', coalesce((
      select jsonb_object_agg(category, c) from (
        select category, count(*) c from public.photos where user_id = auth.uid() group by 1) s), '{}'::jsonb),
    'cameras', coalesce((
      select jsonb_object_agg(camera, c) from (
        select camera, count(*) c from public.photos
         where user_id = auth.uid() and camera is not null group by 1 order by 2 desc limit 20) s), '{}'::jsonb),
    'tags', coalesce((
      select jsonb_agg(t order by n desc, t) from (
        select t, count(*) n from public.photos, unnest(tags) t
         where user_id = auth.uid() group by t order by n desc, t limit 50) s), '[]'::jsonb)
  );
$$;

revoke execute on function public.reorder_photos(uuid[]), public.reorder_albums(uuid[]), public.library_stats() from public, anon;
grant execute on function public.reorder_photos(uuid[]), public.reorder_albums(uuid[]), public.library_stats() to authenticated;

-- ───────────────────────────── Storage ────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists photos_storage_select on storage.objects;
create policy photos_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists photos_storage_insert on storage.objects;
create policy photos_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists photos_storage_update on storage.objects;
create policy photos_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists photos_storage_delete on storage.objects;
create policy photos_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
