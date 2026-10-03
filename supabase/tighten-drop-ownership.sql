-- ============================================================
--  AgriJump — tighten who is allowed to claim a drop
-- ------------------------------------------------------------
--  Supabase -> SQL Editor -> New query -> paste this whole file -> Run
--  Safe to run more than once.
--
--  THE PROBLEM
--    `drop_owners` is what proves "this drop is mine". The app writes a
--    private secret there right after creating a drop, and
--    delete_own_drop() only deletes when the secret you send matches.
--
--    But the insert policy was `with check (true)`, so ANYONE could write
--    an owner row for ANY drop that did not already have one - and then
--    delete it through delete_own_drop(). Drops created before this table
--    existed, or whose claim failed on a flaky connection, stayed
--    permanently deletable by strangers.
--
--  THE FIX
--    Only allow claiming a drop that was created moments ago. The app
--    claims its own drop milliseconds after inserting it, so five minutes
--    is generous even on a slow phone, while an attacker gets almost no
--    opening.
--
--    Nothing that is already claimed is affected: drop_id is the primary
--    key, so the first claim wins and this only constrains NEW claims.
--
--  AFTER RUNNING THIS
--    Posting a drop in the app keeps working exactly as before. The only
--    change is that an unclaimed drop stops being up for grabs after
--    five minutes, instead of forever.
-- ============================================================

-- 1. Remove the wide-open policy
drop policy if exists "anyone can claim a new drop" on public.drop_owners;

-- 2. Replace it with one that only accepts a freshly created drop
drop policy if exists "claim a drop right after creating it" on public.drop_owners;

create policy "claim a drop right after creating it"
  on public.drop_owners for insert
  with check (
    exists (
      select 1
        from public.drops d
       where d.id = drop_owners.drop_id
         and d.created_at > now() - interval '5 minutes'
    )
  );

-- ------------------------------------------------------------
--  Verify: you should see exactly ONE insert policy, and its
--  with_check column should contain the interval expression.
-- ------------------------------------------------------------
select policyname, cmd, with_check
  from pg_policies
 where schemaname = 'public'
   and tablename = 'drop_owners'
 order by policyname;

-- ============================================================
--  Done.
--
--  OPTIONAL - cleaning up a "orphan" drop
--    A drop whose owner row was never written (created before this
--    table existed) can no longer be claimed by anyone, including you,
--    so the app's delete button will not work on it. If you want one
--    gone, uncomment the line below and paste the drop id.
-- ------------------------------------------------------------
-- delete from public.drops where id = '00000000-0000-4000-8000-000000000000';
-- ============================================================
