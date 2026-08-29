import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus } from "@/lib/types/database";
import { countTeacherStyleStats } from "@/lib/status";

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
      "id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, scheduled_date, teacher_id, profiles!transactions_teacher_id_fkey(full_name)"
    )
    .order("submitted_at", { ascending: false });

  const stats = countTeacherStyleStats(
    (transactions ?? []).map((t) => ({ current_status: t.current_status as TransactionStatus }))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="School Administrative Dashboard"
        subtitle="Verify and endorse transactions from your school"
        role="school_admin"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <StatCards
          stats={[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending, accent: "text-amber-600" },
            { label: "Approved", value: stats.approved, accent: "text-green-600" },
            { label: "Disapproved", value: stats.rejected, accent: "text-red-600" },
          ]}
        />

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
                  <li key={t.id}>
                    <TransactionListRow
                      href={`/dashboard/school-admin/transactions/${t.id}`}
                      transaction={t}
                      meta={teacherName ?? "Unknown teacher"}
                    />
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