import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TeacherTransactionList from "@/components/TeacherTransactionList";
import type { TransactionStatus } from "@/lib/types/database";
import { countTeacherStyleStats } from "@/lib/status";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Teacher Dashboard"
        subtitle="Your submitted transactions"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{today}</p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h2>
          </div>
          <Link
            href="/dashboard/teacher/new"
            className="hover-lift inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Transaction
          </Link>
        </div>

        <StatCards
          stats={[
            { label: "Total", value: stats.total, icon: "total" },
            { label: "Pending", value: stats.pending, accent: "text-amber-600", icon: "pending" },
            { label: "Approved", value: stats.approved, accent: "text-green-600", icon: "approved" },
            { label: "For Correction", value: stats.rejected, accent: "text-red-600", icon: "rejected" },
          ]}
        />

        <h3 className="mb-3 text-base font-medium text-slate-900">My Transactions</h3>

        <TeacherTransactionList transactions={transactions ?? []} basePath="/dashboard/teacher/transactions" />
      </main>
    </div>
  );
}
