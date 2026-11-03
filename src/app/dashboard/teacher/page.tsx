import Link from "next/link";
import { getSession } from "@/lib/session";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TeacherTransactionList from "@/components/TeacherTransactionList";
import LoginScene from "@/components/LoginScene";
import type { TransactionStatus } from "@/lib/types/database";
import { countTeacherStyleStats, getTransactionLabel } from "@/lib/status";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TeacherDashboard() {
  const { supabase, user, profile } = await getSession();

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

  // One-line status summary for the banner.
  const summary =
    stats.total === 0
      ? "You haven't filed anything yet. Start a request whenever you're ready."
      : [
          stats.pending > 0 && `${stats.pending} ${stats.pending === 1 ? "request is" : "requests are"} in progress`,
          stats.rejected > 0 && `${stats.rejected} ${stats.rejected === 1 ? "needs" : "need"} your correction`,
        ]
          .filter(Boolean)
          .join(" and ") + (stats.pending > 0 || stats.rejected > 0 ? "." : "All your requests are complete.");

  // Earliest Division visit date that hasn't passed yet — the whole point of
  // scheduling is that teachers only travel when it's worth it.
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextVisit = (transactions ?? [])
    .filter((t) => t.scheduled_date && t.scheduled_date >= todayIso)
    .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1))[0];

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Teacher Dashboard"
        subtitle="Your submitted transactions"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-[59rem] px-6 py-8">
        {/* Welcome banner with the animated request flow on the right */}
        <section className="login-hero animate-in relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-soft)] px-6 py-7 sm:px-8">
          <div className="relative z-[1] sm:max-w-[54%]">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--deped-blue)] uppercase">{today}</p>
            <h2 className="mt-2 font-display text-3xl leading-tight font-semibold text-slate-900">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{summary}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/teacher/new"
                className="hover-lift inline-flex items-center gap-2 rounded-full bg-[var(--deped-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Transaction
              </Link>

              {nextVisit && (
                <Link
                  href={`/dashboard/teacher/transactions/${nextVisit.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-medium whitespace-nowrap text-emerald-800 hover:bg-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                    <path strokeLinecap="round" d="M8 3v4M16 3v4M3.5 10h17" />
                  </svg>
                  Division visit{" "}
                  {new Date(nextVisit.scheduled_date + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  <span className="hidden text-emerald-600 sm:inline">&middot; {getTransactionLabel(nextVisit)}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute top-1/2 -right-[4%] hidden w-[50%] -translate-y-[46%] sm:block">
            <LoginScene idPrefix="teacher" />
          </div>
        </section>

        <StatCards
          stats={[
            { label: "Total", value: stats.total, icon: "total" },
            { label: "Pending", value: stats.pending, accent: "text-amber-600", icon: "pending" },
            { label: "Approved", value: stats.approved, accent: "text-green-600", icon: "approved" },
            { label: "For Correction", value: stats.rejected, accent: "text-red-600", icon: "rejected" },
          ]}
        />

        <h3 className="mb-3 font-display text-lg font-semibold text-slate-900">My Transactions</h3>

        <TeacherTransactionList transactions={transactions ?? []} basePath="/dashboard/teacher/transactions" />
      </main>
    </div>
  );
}
