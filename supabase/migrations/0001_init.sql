-- ============================================================================
-- Digital SOP System — Division of Capiz
-- Initial schema + Row Level Security (RLS) policies
--
-- Pilot scope: two transaction types —
--   1. authority_to_travel
--   2. leave_application (covers maternity leave and leave credits)
-- Transfer of Assignment is intentionally NOT modeled yet (documented only).
--
-- Design principle: authorization is enforced in TWO independent layers —
--   (1) route guards in src/lib/supabase/middleware.ts, and
--   (2) Row Level Security here, at the database itself.
-- A mistake in one layer does not expose data, because the other still holds.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('teacher', 'school_admin', 'division', 'super_admin');

create type transaction_type as enum ('authority_to_travel', 'leave_application');

create type leave_kind as enum ('maternity', 'leave_credits');

create type transaction_status as enum (
  'submitted',
  'under_verification',
  'for_correction',
  'endorsed',
  'under_processing',
  'approved_completed',
  'released'
);

-- ---------------------------------------------------------------------------
-- Schools
-- ---------------------------------------------------------------------------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text,
  is_remote boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users with role + school + display info)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  employee_id text,
  role user_role not null default 'teacher',
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Helper: current user's role, via SECURITY DEFINER to avoid recursive RLS
-- (a policy on `profiles` that queries `profiles` would otherwise recurse).
create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_school()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

-- Auto-create a profile row when a new auth user signs up.
-- Role/school/full_name are passed via signup metadata (see app/(auth)/register).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, employee_id, role, school_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed User'),
    new.raw_user_meta_data->>'employee_id',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'teacher'),
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- SOP Catalog — the reference content teachers browse before submitting
-- ---------------------------------------------------------------------------
create table public.sop_catalog (
  id uuid primary key default gen_random_uuid(),
  transaction_type transaction_type not null unique,
  title text not null,
  purpose text not null,
  requirements text[] not null default '{}',
  steps text[] not null default '{}',
  responsible_offices text not null default '',
  processing_time_days integer not null default 5,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transactions — one row per submitted request
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type transaction_type not null,
  leave_kind leave_kind, -- only set when transaction_type = 'leave_application'
  sop_catalog_id uuid not null references public.sop_catalog(id),
  teacher_id uuid not null references public.profiles(id),
  school_id uuid not null references public.schools(id),
  details jsonb not null default '{}', -- form fields: dates, destination, reason, etc.
  current_status transaction_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_kind_required_for_leave check (
    (transaction_type = 'leave_application' and leave_kind is not null)
    or (transaction_type <> 'leave_application' and leave_kind is null)
  )
);

create index transactions_teacher_idx on public.transactions(teacher_id);
create index transactions_school_idx on public.transactions(school_id);
create index transactions_status_idx on public.transactions(current_status);

-- ---------------------------------------------------------------------------
-- Transaction documents — uploaded files, metadata only (bytes live in Storage)
-- ---------------------------------------------------------------------------
create table public.transaction_documents (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  storage_path text not null, -- path inside the 'transaction-documents' bucket
  file_name text not null,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Transaction status log — full audit trail of every status change
-- ---------------------------------------------------------------------------
create table public.transaction_status_log (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  status transaction_status not null,
  changed_by uuid not null references public.profiles(id),
  note text,
  changed_at timestamptz not null default now()
);

-- Keep transactions.current_status / updated_at in sync whenever a log entry
-- is inserted, so callers only ever need to insert into the log table.
create or replace function public.apply_status_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.transactions
  set current_status = new.status,
      updated_at = now()
  where id = new.transaction_id;
  return new;
end;
$$;

create trigger on_status_log_insert
  after insert on public.transaction_status_log
  for each row execute procedure public.apply_status_log();

-- Seed the initial "submitted" log entry automatically on transaction insert.
create or replace function public.seed_initial_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.transaction_status_log (transaction_id, status, changed_by, note)
  values (new.id, 'submitted', new.teacher_id, 'Initial submission');
  return new;
end;
$$;

create trigger on_transaction_insert
  after insert on public.transactions
  for each row execute procedure public.seed_initial_status();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, is_read);

-- Notify the teacher (and school admin) whenever a transaction's status changes.
create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
begin
  select teacher_id, school_id into t from public.transactions where id = new.transaction_id;

  insert into public.notifications (user_id, transaction_id, message)
  values (
    t.teacher_id,
    new.transaction_id,
    'Your transaction status changed to: ' || new.status::text
  );

  -- Also notify whichever school_admin belongs to that school.
  insert into public.notifications (user_id, transaction_id, message)
  select p.id, new.transaction_id, 'A transaction from your school changed to: ' || new.status::text
  from public.profiles p
  where p.role = 'school_admin' and p.school_id = t.school_id;

  return new;
end;
$$;

create trigger on_status_log_notify
  after insert on public.transaction_status_log
  for each row execute procedure public.notify_on_status_change();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.sop_catalog enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_documents enable row level security;
alter table public.transaction_status_log enable row level security;
alter table public.notifications enable row level security;

-- schools: everyone signed in can read (needed for signup dropdown, dashboards)
create policy "schools_select_authenticated" on public.schools
  for select to authenticated using (true);

create policy "schools_manage_super_admin" on public.schools
  for all to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- profiles: a user can read/update their own profile.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- school_admin can see profiles of teachers in their own school (to display names).
create policy "profiles_select_school_admin" on public.profiles
  for select to authenticated
  using (
    public.current_user_role() = 'school_admin'
    and school_id = public.current_user_school()
  );

-- division / super_admin can see all profiles.
create policy "profiles_select_division_admin" on public.profiles
  for select to authenticated
  using (public.current_user_role() in ('division', 'super_admin'));

-- sop_catalog: any authenticated user can read active SOPs.
create policy "sop_catalog_select_active" on public.sop_catalog
  for select to authenticated using (is_active = true);

-- only super_admin can create/edit/deactivate SOP entries.
create policy "sop_catalog_manage_super_admin" on public.sop_catalog
  for all to authenticated
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- transactions:
-- Teacher: full access to their OWN transactions only.
create policy "transactions_select_own_teacher" on public.transactions
  for select to authenticated
  using (teacher_id = auth.uid());

create policy "transactions_insert_own_teacher" on public.transactions
  for insert to authenticated
  with check (teacher_id = auth.uid() and public.current_user_role() = 'teacher');

-- School Admin: can see (and update status for) transactions from their own school.
create policy "transactions_select_school_admin" on public.transactions
  for select to authenticated
  using (
    public.current_user_role() = 'school_admin'
    and school_id = public.current_user_school()
  );

create policy "transactions_update_school_admin" on public.transactions
  for update to authenticated
  using (
    public.current_user_role() = 'school_admin'
    and school_id = public.current_user_school()
  );

-- Division / Super Admin: can see and update all transactions.
create policy "transactions_select_division_admin" on public.transactions
  for select to authenticated
  using (public.current_user_role() in ('division', 'super_admin'));

create policy "transactions_update_division_admin" on public.transactions
  for update to authenticated
  using (public.current_user_role() in ('division', 'super_admin'));

-- transaction_documents: visibility follows the parent transaction's visibility.
create policy "documents_select_related" on public.transaction_documents
  for select to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_documents.transaction_id
      and (
        t.teacher_id = auth.uid()
        or (public.current_user_role() = 'school_admin' and t.school_id = public.current_user_school())
        or public.current_user_role() in ('division', 'super_admin')
      )
    )
  );

create policy "documents_insert_teacher_own" on public.transaction_documents
  for insert to authenticated
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_documents.transaction_id
      and t.teacher_id = auth.uid()
    )
  );

-- transaction_status_log: visibility follows the parent transaction's visibility.
create policy "status_log_select_related" on public.transaction_status_log
  for select to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_status_log.transaction_id
      and (
        t.teacher_id = auth.uid()
        or (public.current_user_role() = 'school_admin' and t.school_id = public.current_user_school())
        or public.current_user_role() in ('division', 'super_admin')
      )
    )
  );

-- Only school_admin/division/super_admin may append status changes
-- (teachers cannot self-approve their own transaction).
create policy "status_log_insert_staff" on public.transaction_status_log
  for insert to authenticated
  with check (
    changed_by = auth.uid()
    and public.current_user_role() in ('school_admin', 'division', 'super_admin')
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_status_log.transaction_id
      and (
        (public.current_user_role() = 'school_admin' and t.school_id = public.current_user_school())
        or public.current_user_role() in ('division', 'super_admin')
      )
    )
  );

-- notifications: a user can only ever see their own.
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid());

-- ============================================================================
-- Storage bucket for uploaded documents (private — access via signed policies)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('transaction-documents', 'transaction-documents', false)
on conflict (id) do nothing;

-- File path convention: {transaction_id}/{filename}
-- Readable by the same people who can read the transaction row.
create policy "storage_select_related"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'transaction-documents'
    and exists (
      select 1 from public.transactions t
      where t.id::text = (storage.foldername(name))[1]
      and (
        t.teacher_id = auth.uid()
        or (public.current_user_role() = 'school_admin' and t.school_id = public.current_user_school())
        or public.current_user_role() in ('division', 'super_admin')
      )
    )
  );

create policy "storage_insert_teacher_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'transaction-documents'
    and exists (
      select 1 from public.transactions t
      where t.id::text = (storage.foldername(name))[1]
      and t.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- Seed data: SOP catalog entries for the two pilot transaction types
-- ============================================================================
insert into public.sop_catalog (transaction_type, title, purpose, requirements, steps, responsible_offices, processing_time_days)
values
(
  'authority_to_travel',
  'Authority to Travel (Local/International)',
  'Secures official permission for a teacher/personnel to travel for work-related, training, or personal reasons requiring official leave from post.',
  array[
    'Letter request addressed to the Schools Division Superintendent',
    'Approved travel itinerary/invitation (if applicable)',
    'Certificate of no pending administrative case (if required)',
    'Endorsement from the School Head'
  ],
  array[
    'Teacher prepares letter request and supporting documents',
    'School Head reviews and endorses the request',
    'School Administrative Officer verifies completeness and forwards to Division Office',
    'Division Office reviews and processes approval',
    'Authority to Travel is released to the requesting teacher'
  ],
  'School Head, School Administrative Officer, Division Office (Office of the SDS)',
  5
),
(
  'leave_application',
  'Application for Leave (Maternity Leave / Leave Credits)',
  'Allows a teacher/personnel to formally apply for maternity leave or use accumulated leave credits, in accordance with Civil Service and DepEd leave policies.',
  array[
    'Duly accomplished Application for Leave (CS Form 6)',
    'Medical certificate (for maternity leave)',
    'Updated leave credit record',
    'Endorsement from the School Head'
  ],
  array[
    'Teacher accomplishes the Application for Leave form and gathers supporting documents',
    'School Head/Administrative Officer verifies leave credit balance and endorses the application',
    'Administrative Officer forwards the application to the Division Office',
    'Division Office (Records/HR Section) reviews and processes the leave application',
    'Approved leave is released and leave credits are updated accordingly'
  ],
  'School Head, School Administrative Officer, Division Office (HR/Records Section)',
  7
)
on conflict (transaction_type) do nothing;
