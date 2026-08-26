import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TransactionSearchBar from "@/components/TransactionSearchBar";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus } from "@/lib/types/database";
import { countDivisionStyleStats, getTransactionLabel } from "@/lib/status";

export default async function DivisionDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
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
    .select(
      "id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, profiles!transactions_teacher_id_fkey(full_name), schools(name)"
    )
    .order("submitted_at", { ascending: false });

  const rows = (transactions ?? []).map((t) => {
    const teacherName = Array.isArray(t.profiles)
      ? t.profiles[0]?.full_name
      : (t.profiles as { full_name: string } | null)?.full_name;
    const schoolName = Array.isArray(t.schools) ? t.schools[0]?.name : (t.schools as { name: string } | null)?.name;
    return { ...t, teacherName: teacherName ?? "Unknown", schoolName: schoolName ?? "Unknown school" };
  });

  // Simple case-insensitive substring match on teacher name, school name,
  // or the transaction's display label (e.g. "Transfer of Assignment").
  // Search is applied server-side, after RLS has already scoped the rows
  // Division is allowed to see — it isn't a security boundary, just a filter.
  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (t) =>
          t.teacherName.toLowerCase().includes(query) ||
          t.schoolName.toLowerCase().includes(query) ||
          getTransactionLabel(t).toLowerCase().includes(query)
      )
    : rows;

  const stats = countDivisionStyleStats(rows.map((t) => ({ current_status: t.current_status as TransactionStatus })));

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Division Office Dashboard"
        subtitle="Process endorsed transactions"
        role="division"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <StatCards
          stats={[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending, accent: "text-slate-600" },
            { label: "Processing", value: stats.processing, accent: "text-indigo-600" },
            { label: "Approved", value: stats.approved, accent: "text-green-600" },
            { label: "Rejected", value: stats.rejected, accent: "text-red-600" },
          ]}
        />

        <TransactionSearchBar action="/dashboard/division" defaultValue={q} />

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              {query ? `No transactions match "${q}".` : "No transactions yet."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <li key={t.id}>
                  <TransactionListRow
                    href={`/dashboard/division/transactions/${t.id}`}
                    transaction={t}
                    meta={`${t.teacherName} · ${t.schoolName}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
