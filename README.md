# Aura Gallery — Expo + Supabase

Private photo albums with drag-to-reorder, smart categories, server-side search and per-user storage.
Built on **Expo SDK 57** (needs an Expo Go build that supports SDK 57) on iOS and Android.

## 1. Supabase setup (once)
1. Create a project at supabase.com.
2. Open **SQL Editor**, run `supabase/migrations/0001_init.sql`, then `0002_upload_hardening.sql`. This creates the tables, Row Level Security, RPCs and the **private** `photos` storage bucket.
3. **Authentication → Providers → Email** is enabled by default. For quick testing you can turn off "Confirm email".
4. **Project Settings → API**: copy the *Project URL* and the *anon public* key.

## 2. Run the app
```bash
cp .env.example .env     # paste URL + anon key
npm install --legacy-peer-deps
npx expo start -c        # scan the QR with Expo Go
```
Never put the `service_role` key in the app.

## Architecture
```
App.tsx                 root: providers + navigator
src/
  app/                  providers, navigator, tab shell
  config/env.ts         validated env + app limits (debounce, page size…)
  lib/                  supabase client, secure session storage, react-query client
  types/                domain models (Photo, Album…) and DB row shapes
  services/             ALL backend calls (auth, photos, albums, storage) + mappers
  hooks/                useDebouncedValue, useDebouncedSearch, useResponsive
  components/ui/        design-system primitives (Button, TextField, BottomSheet…)
  features/
    auth/               AuthContext + sign in / sign up
    photos/             hooks (react-query), components, PhotosScreen
    albums/             hooks, components, AlbumsScreen
    explore/            ExploreScreen (stats, tags, cameras, account)
  theme/                colours, spacing, type scale
  utils/                validation (zod), search sanitising, errors, formatting
supabase/migrations/    schema, RLS, storage policies
```
Data flow: **screen → feature hook (React Query) → service → Supabase**. Screens never call Supabase directly.

## Security
- **RLS on every table**; policies restrict rows to `auth.uid()`. DB checks also enforce that a photo's album and storage path belong to the same user.
- **Private bucket** with per-user folder policies, 10 MB limit, image MIME allow-list; images are served through short-lived **signed URLs**.
- Session tokens live in the **OS keychain/keystore** (expo-secure-store), not AsyncStorage.
- Uploads are re-encoded and resized on device, which **strips EXIF/GPS**; coordinates are never read or stored.
- All input validated with zod client-side and with CHECK constraints server-side; search terms are allow-listed so `%`, `_` and filter syntax can't be injected.
- Error messages shown to users are generic; raw backend errors are only logged in dev. Cache is cleared on sign-out.

## Upload / file-format security
Defence in depth, client **and** server:
1. **Allow-list** — only JPEG, PNG, WebP are accepted. SVG, HTML, PDF, archives, executables and unknown types are rejected.
2. **Real content check** — the file's magic bytes are read (`src/utils/imageSecurity.ts`); file name, extension and client-reported MIME type are never trusted. Size (40 MB in) and pixel (100 MP) caps run *before* decoding to blunt decompression bombs.
3. **Decode + re-encode** — a native image decoder must fully decode the file; it is then resized and re-encoded to a fresh JPEG, which discards metadata, appended data and embedded payloads. The output signature and size (≤ 10 MB) are verified again before upload.
4. **Storage policy** — bucket is private and accepts `image/jpeg` ≤ 10 MB only; object names must be `<your-uid>/<uuid>.jpg`; objects are immutable (no overwrite); per-user quota (5 000 files); signed URLs expire after 1 h; files are only ever rendered as images, never executed.

Threat model note: a malicious user who bypasses the app and calls the Storage API directly is still limited by the bucket MIME/size/name rules and quota, and their files are only visible to their own account (RLS + signed URLs). Supabase Storage cannot inspect bytes in SQL; if you ever share files *between* users, add server-side scanning (e.g. an Edge Function that re-validates and re-encodes) before exposing them.

## Search & performance
Every search box (photos, albums, tag filter) uses `useDebouncedSearch` (350 ms, sanitised, length-capped). Photo search is a single trigram-indexed column; lists are paginated (30/page) with infinite scroll; images use expo-image disk cache keyed by storage path.

## Responsive
`useResponsive` drives grid columns (2 → 5), content max-width on tablets, safe-area insets (notch, Android edge-to-edge, home indicator), keyboard avoiding sheets, and capped font scaling.

## Notes
- Reordering moves only the loaded rows and keeps all other slots intact (`reorder_photos` / `reorder_albums` RPCs).
- Deleting a photo removes the row, then the stored file.
- Store versions of Expo Go lag behind new SDKs. If Expo Go reports missing native modules or a version mismatch, use a build that supports SDK 57 (Expo Go for the iOS simulator / Android from expo.dev/go, `eas go`, or a development build), or downgrade to SDK 54.
