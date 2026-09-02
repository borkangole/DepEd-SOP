import { createClient } from "@/lib/supabase/server";
import StatCards from "@/components/StatCards";
import TransactionSearchBar from "@/components/TransactionSearchBar";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus } from "@/lib/types/database";
import { countDivisionStyleStats, getTransactionLabel } from "@/lib/status";

// Super Admin can see every transaction system-wide (same RLS policy as
// Division), so it gets the same search + stat-card treatment.
export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, scheduled_date, profiles!transactions_teacher_id_fkey(full_name), schools(name)"
    )
    .order("submitted_at", { ascending: false });

  const rows = (transactions ?? []).map((t) => {
    const teacherName = Array.isArray(t.profiles)
      ? t.profiles[0]?.full_name
      : (t.profiles as { full_name: string } | null)?.full_name;
    const schoolName = Array.isArray(t.schools) ? t.schools[0]?.name : (t.schools as { name: string } | null)?.name;
    return { ...t, teacherName: teacherName ?? "Unknown", schoolName: schoolName ?? "Unknown school" };
  });

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
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Every request filed across the division, oldest override rights included.</p>
      </div>

      <StatCards
        stats={[
          { label: "Total", value: stats.total, icon: "total" },
          { label: "Pending", value: stats.pending, accent: "text-amber-600", icon: "pending" },
          { label: "Processing", value: stats.processing, accent: "text-indigo-600", icon: "processing" },
          { label: "Approved", value: stats.approved, accent: "text-green-600", icon: "approved" },
          { label: "For Correction", value: stats.rejected, accent: "text-red-600", icon: "rejected" },
        ]}
      />

      <TransactionSearchBar action="/dashboard/admin/transactions" defaultValue={q} />

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {query ? `No transactions match "${q}".` : "No transactions yet."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {filtered.map((t, i) => (
              <li key={t.id}>
                <TransactionListRow
                  href={`/dashboard/admin/transactions/${t.id}`}
                  transaction={t}
                  meta={`${t.teacherName} · ${t.schoolName}`}
                  index={i}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
