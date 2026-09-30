-- ============================================================
--  AgriJump — database schema
-- ------------------------------------------------------------
--  HOW TO USE
--    Supabase dashboard → left sidebar → "SQL Editor"
--    → "New query" → paste this ENTIRE file → click "Run".
--
--  Safe to run more than once (everything is IF NOT EXISTS /
--  DROP POLICY IF EXISTS).
--
--  Design note: there is deliberately NO sign-up wall.
--  Any device may read every drop and post new ones.
--  Each device carries its own random id, so the app can tell
--  "this is mine" apart without an account.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
--  drops — one row per posted activity
-- ------------------------------------------------------------
create table if not exists public.drops (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 120),
  tagline       text not null default '',
  description   text not null default '',
  category      text not null default 'social',
  emoji         text not null default '🍻',
  place_name    text not null default '',
  lat           double precision not null,
  lng           double precision not null,
  starts_at     timestamptz not null,
  duration_min  integer not null default 60 check (duration_min between 15 and 600),
  capacity      integer not null default 8 check (capacity between 2 and 999),
  host_id       text not null,
  host_name     text not null default 'Someone',
  host_major    text,
  host_avatar   text,
  host_bio      text,
  cover         text not null default '',
  vibe          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists drops_starts_at_idx on public.drops (starts_at desc);

-- ------------------------------------------------------------
--  drop_joins — who tapped "Drop In"
-- ------------------------------------------------------------
create table if not exists public.drop_joins (
  id         uuid primary key default gen_random_uuid(),
  drop_id    uuid not null references public.drops(id) on delete cascade,
  user_id    text not null,
  name       text not null default 'Someone',
  major      text,
  avatar     text,
  created_at timestamptz not null default now(),
  unique (drop_id, user_id)
);

create index if not exists drop_joins_drop_id_idx on public.drop_joins (drop_id);

-- ------------------------------------------------------------
--  Row Level Security
-- ------------------------------------------------------------
alter table public.drops      enable row level security;
alter table public.drop_joins enable row level security;

-- --- read: everyone with the app link ---
drop policy if exists "drops are readable by everyone" on public.drops;
create policy "drops are readable by everyone"
  on public.drops for select
  using (true);

drop policy if exists "joins are readable by everyone" on public.drop_joins;
create policy "joins are readable by everyone"
  on public.drop_joins for select
  using (true);

-- --- create: everyone (no sign-up wall) ---
drop policy if exists "anyone can post a drop" on public.drops;
create policy "anyone can post a drop"
  on public.drops for insert
  with check (true);

drop policy if exists "anyone can drop in" on public.drop_joins;
create policy "anyone can drop in"
  on public.drop_joins for insert
  with check (true);

-- --- leave a drop again (un-join) ---
-- NOTE: without accounts the server cannot prove who owns a row, so
-- this is permissive by design. Worst case someone removes another
-- person from a guest list. Acceptable for a campus app; add Supabase
-- Auth later if you need per-user ownership.
drop policy if exists "anyone can leave a drop" on public.drop_joins;
create policy "anyone can leave a drop"
  on public.drop_joins for delete
  using (true);

-- Deliberately NO direct delete/update policy on `drops`:
-- nobody can wipe the board through the public API.
-- Cancelling your OWN drop goes through delete_own_drop() below.

-- ------------------------------------------------------------
--  drop_owners — proves who may cancel a drop
-- ------------------------------------------------------------
--  Why a secret and not host_id?
--  host_id sits in the publicly readable `drops` table, so anyone
--  could copy it and delete someone else's drop. The app instead
--  keeps a private secret on the device and registers it here —
--  and this table has NO public read policy, so it can never be
--  read back through the API.
create table if not exists public.drop_owners (
  drop_id    uuid primary key references public.drops(id) on delete cascade,
  secret     text not null,
  created_at timestamptz not null default now()
);

alter table public.drop_owners enable row level security;

drop policy if exists "anyone can claim a new drop" on public.drop_owners;
create policy "anyone can claim a new drop"
  on public.drop_owners for insert
  with check (true);

-- (No select policy on purpose — the secrets stay unreadable.)

-- ------------------------------------------------------------
--  delete_own_drop() — cancel a drop, but only your own
-- ------------------------------------------------------------
create or replace function public.delete_own_drop(p_drop_id uuid, p_secret text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  if p_secret is null or length(p_secret) < 16 then
    return 0;
  end if;

  delete from public.drops d
  using public.drop_owners o
  where d.id = p_drop_id
    and o.drop_id = p_drop_id
    and o.secret = p_secret;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

grant execute on function public.delete_own_drop(uuid, text) to anon, authenticated;

-- ============================================================
--  Done. You should see "Success. No rows returned".
-- ============================================================
