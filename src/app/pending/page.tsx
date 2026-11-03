import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import type { AccountStatus, UserRole } from "@/lib/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  teacher: "Teacher / Personnel",
  school_admin: "School Admin",
  division: "Division Office",
  super_admin: "Super Admin",
};

// Who reviews each kind of account — mirrors review_registration() in
// 0009_registration_approval.sql, so the message tells people who to follow
// up with.
const APPROVER: Record<UserRole, string> = {
  teacher: "your School Admin",
  school_admin: "the Division Office",
  division: "the system administrator",
  super_admin: "the system administrator",
};

// Where signed-in accounts that aren't approved yet land. The middleware
// sends every /dashboard request here until status = 'approved'.
export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status, schools(name)")
    .eq("id", user.id)
    .single();

  const status = (profile?.status as AccountStatus | undefined) ?? "pending";
  if (status === "approved") redirect("/dashboard");

  const role = (profile?.role as UserRole | undefined) ?? "teacher";
  const schoolName = Array.isArray(profile?.schools)
    ? profile?.schools[0]?.name
    : (profile?.schools as { name: string } | null | undefined)?.name;
  const rejected = status === "rejected";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="animate-in w-full max-w-md rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-8 shadow-sm">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            rejected ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            {rejected ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            )}
          </svg>
        </span>

        <h1 className="mt-4 font-display text-xl font-semibold text-slate-900">
          {rejected ? "Registration not approved" : "Waiting for approval"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {rejected ? (
            <>
              Your account wasn&rsquo;t approved, so it can&rsquo;t access the system. If you think this is a
              mistake, please contact {APPROVER[role]}.
            </>
          ) : (
            <>
              Thanks for registering. Your account needs to be approved by {APPROVER[role]} before you can use the
              system. You&rsquo;ll get full access as soon as it&rsquo;s approved &mdash; just sign in again.
            </>
          )}
        </p>

        <dl className="mt-5 space-y-1.5 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-right font-medium text-slate-900">{profile?.full_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Registered as</dt>
            <dd className="text-right font-medium text-slate-900">{ROLE_LABEL[role]}</dd>
          </div>
          {schoolName && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">School</dt>
              <dd className="text-right font-medium text-slate-900">{schoolName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Status</dt>
            <dd className={`text-right font-medium ${rejected ? "text-red-600" : "text-amber-700"}`}>
              {rejected ? "Not approved" : "Pending approval"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
