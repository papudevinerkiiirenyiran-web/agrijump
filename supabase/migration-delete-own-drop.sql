-- ============================================================
--  AgriJump — "cancel my own drop"
-- ------------------------------------------------------------
--  Supabase → SQL Editor → New query → paste this whole file → Run
--  Safe to run more than once.
--
--  WHY THIS EXISTS
--    `drops` has no delete policy on purpose — nobody should be
--    able to wipe the board through the public API. But that also
--    meant YOU could not delete your own drop. This fixes that
--    without opening the door for everyone.
--
--  HOW IT WORKS
--    When you post a drop, the app also writes a private random
--    secret into `drop_owners`. That table has NO read policy, so
--    the secret can never be fetched back by anyone.
--    Cancelling goes through a SECURITY DEFINER function that
--    compares the secret you send with the stored one —
--    no match, no delete.
-- ============================================================

-- ------------------------------------------------------------
--  1. Where the ownership secrets live (write-only from the app)
-- ------------------------------------------------------------
create table if not exists public.drop_owners (
  drop_id    uuid primary key references public.drops(id) on delete cascade,
  secret     text not null,
  created_at timestamptz not null default now()
);

alter table public.drop_owners enable row level security;

-- The host registers its secret immediately after creating a drop.
drop policy if exists "anyone can claim a new drop" on public.drop_owners;
create policy "anyone can claim a new drop"
  on public.drop_owners for insert
  with check (true);

-- Deliberately NO select / update / delete policy:
-- a secret can never be read back through the API. That is the whole
-- point — drop_id is the primary key, so whoever claims first wins and
-- nobody can overwrite or discover an existing secret.

-- ------------------------------------------------------------
--  2. Cancel your own drop
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

-- ============================================================
--  Done — you should see "Success. No rows returned".
-- ============================================================
