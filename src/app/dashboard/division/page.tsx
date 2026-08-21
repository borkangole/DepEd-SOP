import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import type { TransactionStatus } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_COLOR, DIVISION_NEXT } from "@/lib/status";

export default async function DivisionDashboard() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, leave_kind, current_status, submitted_at, profiles!transactions_teacher_id_fkey(full_name), schools(name)"
    )
    .order("submitted_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="Division Office Dashboard" subtitle="Process endorsed transactions" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {!transactions || transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const teacherName = Array.isArray(t.profiles)
                  ? t.profiles[0]?.full_name
                  : (t.profiles as { full_name: string } | null)?.full_name;
                const schoolName = Array.isArray(t.schools)
                  ? t.schools[0]?.name
                  : (t.schools as { name: string } | null)?.name;
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
                          {teacherName ?? "Unknown"} · {schoolName ?? "Unknown school"} · Submitted{" "}
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
                        options={DIVISION_NEXT[(t.current_status as TransactionStatus)] ?? []}
                        redirectPath="/dashboard/division"
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
