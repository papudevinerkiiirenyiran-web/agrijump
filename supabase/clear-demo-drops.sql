-- ============================================================
--  AgriJump — clear the demo drops, keep only your own
-- ------------------------------------------------------------
--  Supabase -> SQL Editor -> New query -> paste this whole file -> Run
--  Safe to run more than once.
--
--  WHY
--    An earlier setup step seeded the board with ten demo drops
--    (Frisbee al prato, Caffe e appunti, ...). They are placeholders,
--    not real posts, and they should not be on the board.
--
--    Every seeded row uses an id starting with 5eed0000-, so the
--    delete below can only ever touch those rows. Anything you or
--    your friends posted is left alone.
--
--  If you later want the demo board back:
--    the file is kept in the repo history as supabase/seed-drops.sql
--    (git stash / git log --all -- supabase/seed-drops.sql).
-- ============================================================

-- 1. Roster rows belonging to seeded drops (drop_joins references drops)
delete from public.drop_joins
 where drop_id::text like '5eed0000-%';

-- 2. Ownership secrets for seeded drops. This table only exists once
--    finish-setup.sql has run, so guard it.
do $$
begin
  if to_regclass('public.drop_owners') is not null then
    delete from public.drop_owners where drop_id::text like '5eed0000-%';
  end if;
end $$;

-- 3. The seeded drops themselves
delete from public.drops
 where id::text like '5eed0000-%';

-- 4. Belt and braces: any leftover setup/test rows
delete from public.drops
 where title = '__setup test__'
    or title like 'E2E drop %'
    or title ilike 'delete me %';

-- ------------------------------------------------------------
--  What is left? Expect exactly your own drops.
-- ------------------------------------------------------------
select id, title, host_name, starts_at, created_at
  from public.drops
 order by created_at desc;

-- ============================================================
--  Done. The board should now show only the drops you posted
--  yourself (for example "Coffee break").
-- ============================================================
