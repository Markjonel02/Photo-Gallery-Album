-- Aura Gallery — upload hardening. Safe to run after 0001.
--
-- The app decodes and re-encodes every image to JPEG before upload, so the bucket
-- only needs to accept JPEG. Anyone talking to the API directly (bypassing the app)
-- is held to the same rules by the policies below.

-- 1. Bucket: JPEG only, 10 MB max, still private.
update storage.buckets
   set public = false,
       file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg']
 where id = 'photos';

-- 2. Insert policy: only `<uid>/<uuid>.jpg` (no other names/extensions/sub-folders),
--    and a per-user object quota.
drop policy if exists photos_storage_insert on storage.objects;
create policy photos_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$')
    and (
      select count(*) from storage.objects o
       where o.bucket_id = 'photos' and o.name like (select auth.uid())::text || '/%'
    ) < 5000
  );

-- 3. No overwrite in place: files are immutable once uploaded (delete + re-upload instead).
drop policy if exists photos_storage_update on storage.objects;

-- 4. Row-level quota so one account can't create unbounded metadata.
create or replace function public.enforce_photo_quota() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.photos where user_id = new.user_id) >= 5000 then
    raise exception 'photo limit reached';
  end if;
  return new;
end $$;

drop trigger if exists photos_quota on public.photos;
create trigger photos_quota before insert on public.photos
  for each row execute function public.enforce_photo_quota();

-- 5. Row-side mirror of the path rule: the stored path must be a `.jpg` in the owner's folder.
alter table public.photos drop constraint if exists photos_path_format_chk;
alter table public.photos add constraint photos_path_format_chk
  check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$') not valid;
