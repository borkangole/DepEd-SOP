-- ============================================================================
-- 0010 — Require a DepEd email (@deped.gov.ph) to register
--
-- Run AFTER 0009_registration_approval.sql. Replaces handle_new_user() with
-- the same function plus a domain check at the top, so a signup with any
-- other email is refused by the database itself — even if someone skips the
-- register form and calls the Supabase signup API directly.
--
-- Existing accounts are untouched; this only applies to new signups.
-- Note: this also applies to users added by hand in the Supabase dashboard
-- (Authentication -> Add user) — give them a @deped.gov.ph address too.
-- ============================================================================

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
  -- Only official DepEd accounts may register.
  if lower(split_part(coalesce(new.email, ''), '@', 2)) <> 'deped.gov.ph' then
    raise exception 'Only @deped.gov.ph email addresses can register.';
  end if;

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
