-- ============================================================================
-- 0009 — Registration approval
--
-- Panel feedback (first defense): anyone with the /register link could
-- create a working account. From now on every new account starts as
-- `pending` and can't do anything until an approver accepts it:
--
--   teacher       -> approved by the School Admin of the same school
--                    (Division / Super Admin can also approve, as a fallback)
--   school_admin  -> approved by Division or Super Admin
--   division      -> approved by Super Admin only
--   super_admin   -> never self-registered; promote an approved account
--                    manually in the SQL Editor.
--
-- This also closes two older holes found while reviewing the schema:
--   1. handle_new_user() trusted the `role` sent in the signup request, so a
--      direct API call could self-register as super_admin.
--   2. profiles_update_own had no column restriction, so any signed-in user
--      could change their own role, school, or (now) approval status.
--
-- Safe to run once on the live database. Existing accounts are marked
-- `approved`, so nobody currently using the system is locked out.
-- ============================================================================

-- 1. Approval status on profiles ---------------------------------------------
create type public.account_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column status public.account_status not null default 'pending',
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz;

-- Grandfather every account that exists today.
update public.profiles set status = 'approved';

create index profiles_status_idx on public.profiles (status);

-- 2. Only APPROVED accounts have a role -------------------------------------
-- Every role-based RLS policy goes through these two helpers, so a pending
-- or rejected account fails every one of them automatically. It can still
-- read its own profile (profiles_select_own), which the "awaiting approval"
-- page needs.
create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() and status = 'approved';
$$;

create or replace function public.current_user_school()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.profiles where id = auth.uid() and status = 'approved';
$$;

-- 3. Signup: never trust the requested role, always start pending -----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested text := new.raw_user_meta_data->>'role';
  v_role user_role;
  v_school uuid := nullif(new.raw_user_meta_data->>'school_id', '')::uuid;
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Unnamed User');
  v_label text;
  v_school_admins integer;
begin
  -- Only these three roles can be requested; anything else (including
  -- super_admin) silently becomes teacher.
  if v_requested in ('teacher', 'school_admin', 'division') then
    v_role := v_requested::user_role;
  else
    v_role := 'teacher';
  end if;

  insert into public.profiles (id, full_name, employee_id, role, school_id, status)
  values (
    new.id,
    v_name,
    nullif(trim(new.raw_user_meta_data->>'employee_id'), ''),
    v_role,
    v_school,
    'pending'
  );

  -- Let the people who can approve this account know it's waiting.
  v_label := case v_role
    when 'teacher' then 'teacher'
    when 'school_admin' then 'School Admin'
    else 'Division Office'
  end;

  if v_role = 'teacher' then
    select count(*) into v_school_admins
    from public.profiles
    where role = 'school_admin' and status = 'approved' and school_id = v_school;
  end if;

  insert into public.notifications (user_id, message)
  select p.id, format('New %s registration: %s is waiting for your approval.', v_label, v_name)
  from public.profiles p
  where p.status = 'approved'
    and p.id <> new.id
    and (
      -- teacher: their school's admins; Division + Super Admin only if the
      -- school has no approved admin yet (so nobody gets flooded).
      (v_role = 'teacher' and (
        (p.role = 'school_admin' and p.school_id = v_school)
        or (v_school_admins = 0 and p.role in ('division', 'super_admin'))
      ))
      or (v_role = 'school_admin' and p.role in ('division', 'super_admin'))
      or (v_role = 'division' and p.role = 'super_admin')
    );

  return new;
end;
$$;

-- 4. Lock down which profile columns users can change themselves ------------
-- RLS decides WHICH rows; column privileges decide WHICH columns. Users may
-- still edit their own name and employee ID; role, school and status can
-- only change through review_registration() below or the SQL Editor.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, employee_id) on public.profiles to authenticated;

-- 5. Approve / reject --------------------------------------------------------
-- The only way an account's status changes from the app. Runs as definer so
-- it can update another user's row, but checks the caller's own (approved)
-- role and scope first.
create or replace function public.review_registration(
  target uuid,
  decision public.account_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_role user_role := public.current_user_role();
  v_reviewer_school uuid := public.current_user_school();
  v_target public.profiles%rowtype;
begin
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.';
  end if;

  if v_reviewer_role is null then
    raise exception 'Only approved staff accounts can review registrations.';
  end if;

  select * into v_target from public.profiles where id = target;
  if not found then
    raise exception 'Account not found.';
  end if;

  if v_target.id = auth.uid() then
    raise exception 'You cannot review your own account.';
  end if;

  if not (
    v_reviewer_role = 'super_admin'
    or (v_reviewer_role = 'division' and v_target.role in ('teacher', 'school_admin'))
    or (
      v_reviewer_role = 'school_admin'
      and v_target.role = 'teacher'
      and v_target.school_id = v_reviewer_school
    )
  ) then
    raise exception 'You are not allowed to review this account.';
  end if;

  if v_target.status = decision then
    return; -- already in that state; nothing to do
  end if;

  update public.profiles
  set status = decision, reviewed_by = auth.uid(), reviewed_at = now()
  where id = target;

  insert into public.notifications (user_id, message)
  values (
    target,
    case decision
      when 'approved' then 'Your account has been approved. Welcome to the Digital SOP System!'
      else 'Your account access was not approved. Please contact your School Admin or the Division Office.'
    end
  );
end;
$$;

revoke execute on function public.review_registration(uuid, public.account_status) from public, anon;
grant execute on function public.review_registration(uuid, public.account_status) to authenticated;
