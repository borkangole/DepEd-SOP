-- 0007 added the ability for Division to write a notification directly
-- (the schedule-set notification in updateTransactionSchedule), rather than
-- going through the transaction_status_log trigger, which is the only thing
-- that has ever inserted into `notifications` up to now (via a
-- `security definer` function, which bypasses RLS entirely).
--
-- Without an explicit INSERT policy, RLS default-denies every insert from a
-- normal authenticated session — so that direct insert was failing silently
-- (no error was surfaced, since the client didn't check for one either;
-- see the updated updateTransactionSchedule action). This adds the missing
-- policy: Division/Super Admin may insert a notification for anyone, which
-- matches their existing division-wide read/update access on transactions.

create policy "notifications_insert_division_admin" on public.notifications
  for insert to authenticated
  with check (public.current_user_role() in ('division', 'super_admin'));
