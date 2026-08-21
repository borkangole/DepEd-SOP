import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import type { TransactionStatus } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_COLOR, SCHOOL_ADMIN_NEXT } from "@/lib/status";

export default async function SchoolAdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  // RLS (transactions_select_school_admin) already scopes this to the
  // caller's own school — no need to filter by school_id client-side,
  // but selecting profiles(full_name) requires the related select policy.
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, leave_kind, current_status, submitted_at, teacher_id, profiles!transactions_teacher_id_fkey(full_name)"
    )
    .order("submitted_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="School Administrative Dashboard"
        subtitle="Verify and endorse transactions from your school"
        role="school_admin"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {!transactions || transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No transactions submitted from your school yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const teacherName = Array.isArray(t.profiles)
                  ? t.profiles[0]?.full_name
                  : (t.profiles as { full_name: string } | null)?.full_name;
                return (
                  <li key={t.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {t.transaction_type === "authority_to_travel"
                            ? "Authority to Travel"
                            : `Leave Application (${t.leave_kind === "maternity" ? "Maternity" : "Leave Credits"})`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacherName ?? "Unknown teacher"} · Submitted{" "}
                          {new Date(t.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[(t.current_status as TransactionStatus)]}`}
                      >
                        {STATUS_LABEL[(t.current_status as TransactionStatus)]}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StatusUpdateForm
                        transactionId={t.id}
                        options={SCHOOL_ADMIN_NEXT[(t.current_status as TransactionStatus)] ?? []}
                        redirectPath="/dashboard/school-admin"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
