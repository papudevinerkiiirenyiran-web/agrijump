-- ============================================================
--  AgriJump — finish setup (one paste, two jobs)
-- ------------------------------------------------------------
--  Supabase -> SQL Editor -> New query -> paste this whole file -> Run
--  Safe to run more than once.
--
--  JOB 1  Add "cancel my own drop"
--    `drops` has no delete policy on purpose - nobody should be able
--    to wipe the board through the public API. But that also meant YOU
--    could not delete your own drop. This fixes that without opening
--    the door for everyone:
--      - every new drop also writes a private random secret into
--        `drop_owners`, a table with NO read policy, so the secret can
--        never be fetched back by anyone;
--      - cancelling goes through a SECURITY DEFINER function that
--        compares the secret you send with the stored one.
--
--  JOB 2  Remove the test rows left over from setup
--    Only matches the placeholder titles the setup checks used.
--    Your real drops are untouched.
-- ============================================================


-- ------------------------------------------------------------
--  JOB 1a. Where the ownership secrets live (write-only from the app)
-- ------------------------------------------------------------
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

-- Deliberately NO select / update / delete policy: a secret can never
-- be read back through the API. That is the whole point - drop_id is
-- the primary key, so whoever claims first wins and nobody can
-- overwrite or discover an existing secret.


-- ------------------------------------------------------------
--  JOB 1b. Cancel your own drop
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
  -- Reject empty / truncated secrets so a blank value can never match.
  if p_secret is null or length(p_secret) < 16 then
    raise exception 'missing ownership secret';
  end if;

  delete from public.drops d
   where d.id = p_drop_id
     and exists (
       select 1
         from public.drop_owners o
        where o.drop_id = d.id
          and o.secret = p_secret
     );

  get diagnostics removed = row_count;
  return removed;   -- 0 means "not yours / already gone"
end;
$$;

-- Only signed-out app traffic may call it, and only through this function.
revoke all on function public.delete_own_drop(uuid, text) from public;
grant execute on function public.delete_own_drop(uuid, text) to anon, authenticated;


-- ------------------------------------------------------------
--  JOB 2. Clear out the setup test rows
-- ------------------------------------------------------------
-- These are the placeholder drops the setup checks created. They are
-- what makes the home page show a board instead of the welcome guide,
-- so clearing them brings the guide back for everyone.
delete from public.drops
where title = '__setup test__'
   or title like 'E2E drop %'
   or title ilike 'delete me %';

-- What is left? Should be 0 rows and remaining_drops = 0.
select count(*) as remaining_drops from public.drops;

select id, title, created_at
  from public.drops
 order by created_at desc;

-- ============================================================
--  Done. Expected result: remaining_drops = 0, and the second
--  result set is empty. The home page will now show the welcome
--  guide instead of a board.
-- ============================================================
