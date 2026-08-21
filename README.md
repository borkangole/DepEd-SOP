# Digital SOP System — Division of Capiz (Pilot)

A Next.js + Supabase starter implementing the Teacher → School Administrative
Assistant/Officer → Division Office workflow described in the SOP paper, for
two pilot transaction types:

1. **Authority to Travel** (Local/International)
2. **Leave Application** (Maternity Leave / Leave Credits)

*Transfer of School/Division Assignment* is documented as a future
transaction but is not built in this pilot slice.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — Postgres database, Auth, Row Level Security, Storage

## Security model (two independent layers)

1. **Route guards** in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to
   `proxy.ts` — same idea, new name) check the signed-in user's role before
   letting them into `/dashboard/<role>` routes.
2. **Row Level Security (RLS)** in `supabase/migrations/0001_init.sql`
   enforces the same rules directly in the database — a teacher's query for
   another teacher's transaction returns nothing, even if a route guard is
   ever misconfigured. This is the most important file to read and
   understand before you extend the schema.

## First-time setup

1. **Create a Supabase project** at https://supabase.com/dashboard (free
   tier is enough for a pilot).

2. **Run the migration.** In the Supabase Dashboard, open the SQL Editor and
   paste the contents of `supabase/migrations/0001_init.sql`, then run it.
   This creates all tables, RLS policies, triggers, the storage bucket, and
   seeds the SOP Catalog with the two pilot transaction types.
   (Alternatively, if you have the Supabase CLI installed and linked to your
   project: `npx supabase db push`.)

3. **Add at least one school row** so registration has something to select:
   ```sql
   insert into public.schools (name, district, is_remote)
   values ('Example Elementary School', 'District I', false);
   ```

4. **Create your Division / Super Admin accounts manually** — these are
   intentionally NOT available through public self-registration (see
   `src/app/actions/auth.ts` for why). After a person registers normally as
   a teacher (which creates their `auth.users` + `profiles` row), promote
   them in the SQL Editor:
   ```sql
   update public.profiles set role = 'division' where id = '<their-user-id>';
   -- or role = 'super_admin'
   ```

5. **Copy environment variables.** In the Supabase Dashboard go to
   Project Settings → API, then:
   ```bash
   cp .env.example .env.local
   # paste your Project URL and anon public key into .env.local
   ```

6. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev
   ```
   Visit http://localhost:3000 — you'll be redirected to `/login`.

## What's built vs. what's next

**Built:** auth + 4 roles, SOP catalog (read-only in UI, editable via
Supabase Table Editor for now), teacher submission form for both pilot
transaction types, School Admin verify/endorse/return-for-correction,
Division process/approve/release, full status audit trail
(`transaction_status_log`), and automatic in-app notifications on every
status change.

**Not yet built (documented as next iteration):**
- Document/file upload UI (the storage bucket + RLS policies exist in the
  migration — `transaction-documents` — but no upload widget is wired into
  the submission form yet)
- Email notifications (only in-app `notifications` rows exist right now)
- SOP Catalog editing UI for Super Admin (edit directly in Supabase for now)
- Transfer of Assignment as a third transaction type

## Project structure

```
src/
  app/
    login/, register/, unauthorized/       — auth pages
    dashboard/
      teacher/, teacher/new/               — teacher role
      school-admin/                        — school admin role
      division/                            — division role
      admin/                               — super admin role
    actions/
      auth.ts                              — login/register/logout server actions
      transactions.ts                      — submit / update status server actions
  components/                              — form + UI components
  lib/
    supabase/client.ts, server.ts          — Supabase client helpers
    supabase/middleware.ts                 — session refresh + route guard logic
    status.ts                              — status labels/colors + allowed transitions
    types/database.ts                      — hand-authored schema reference (see note below)
  proxy.ts                                 — Next.js 16 route guard entry point
supabase/
  migrations/0001_init.sql                 — full schema + RLS + seed data
```

**On `src/lib/types/database.ts`:** the Supabase clients in this project are
NOT type-parameterized against it (a hand-maintained strict schema type
fought the query builder more than it helped for a fast-moving pilot). Once
your Supabase project is live, regenerate real types with:
```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/lib/types/database.ts
```
and wire `createBrowserClient<Database>(...)` / `createServerClient<Database>(...)`
back in for full end-to-end type safety.
