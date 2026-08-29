import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus } from "@/lib/types/database";
import { countTeacherStyleStats } from "@/lib/status";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, scheduled_date")
    .eq("teacher_id", user!.id)
    .order("submitted_at", { ascending: false });

  const stats = countTeacherStyleStats(
    (transactions ?? []).map((t) => ({ current_status: t.current_status as TransactionStatus }))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Teacher Dashboard"
        subtitle="Your submitted transactions"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <StatCards
          stats={[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending, accent: "text-amber-600" },
            { label: "Approved", value: stats.approved, accent: "text-green-600" },
            { label: "Disapproved", value: stats.rejected, accent: "text-red-600" },
          ]}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900">My Transactions</h2>
          <Link
            href="/dashboard/teacher/new"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            + New Transaction
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {!transactions || transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              You have no transactions yet. Click &ldquo;New Transaction&rdquo; to submit your first one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <li key={t.id}>
                  <TransactionListRow href={`/dashboard/teacher/transactions/${t.id}`} transaction={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}