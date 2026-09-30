-- ============================================================
--  Remove the test rows created while setting AgriJump up.
-- ------------------------------------------------------------
--  Supabase → SQL Editor → New query → paste → Run
--
--  This is safe: it only matches the placeholder titles the
--  setup checks used. Your real drops are untouched.
-- ============================================================

delete from public.drops
where title = '__setup test__'
   or title like 'E2E drop %';

-- What is left?
select count(*) as remaining_drops from public.drops;
