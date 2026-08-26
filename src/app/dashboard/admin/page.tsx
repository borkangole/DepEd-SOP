import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import TransactionSearchBar from "@/components/TransactionSearchBar";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus } from "@/lib/types/database";
import { countDivisionStyleStats, getTransactionLabel } from "@/lib/status";

export default async function AdminDashboard({
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

  const { data: sopEntries } = await supabase
    .from("sop_catalog")
    .select("id, title, purpose, requirements, steps, processing_time_days, is_active")
    .order("title");

  const { count: schoolCount } = await supabase
    .from("schools")
    .select("id", { count: "exact", head: true });

  const { count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // Super Admin can see every transaction system-wide (same RLS policy as
  // Division), so it gets the same search + stat-card treatment.
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
        title="Super Admin Dashboard"
        subtitle="Manage the SOP catalog"
        role="super_admin"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-semibold text-slate-900">{schoolCount ?? 0}</p>
            <p className="text-sm text-slate-500">Schools registered</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-2xl font-semibold text-slate-900">{userCount ?? 0}</p>
            <p className="text-sm text-slate-500">User accounts</p>
          </div>
        </div>

        <h2 className="mb-3 text-base font-medium text-slate-900">All Transactions</h2>
        <StatCards
          stats={[
            { label: "Total", value: stats.total },
            { label: "Pending", value: stats.pending, accent: "text-slate-600" },
            { label: "Processing", value: stats.processing, accent: "text-indigo-600" },
            { label: "Approved", value: stats.approved, accent: "text-green-600" },
            { label: "Rejected", value: stats.rejected, accent: "text-red-600" },
          ]}
        />

        <TransactionSearchBar action="/dashboard/admin" defaultValue={q} />

        <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              {query ? `No transactions match "${q}".` : "No transactions yet."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <li key={t.id}>
                  <TransactionListRow
                    href={`/dashboard/admin/transactions/${t.id}`}
                    transaction={t}
                    meta={`${t.teacherName} · ${t.schoolName}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <h2 className="mb-3 text-base font-medium text-slate-900">SOP Catalog</h2>
        <div className="space-y-4">
          {(sopEntries ?? []).map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{s.purpose}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">Requirements</p>
              <ul className="ml-4 list-disc text-sm text-slate-700">
                {s.requirements.map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Processing time: {s.processing_time_days} working day(s)
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Editing SOP entries directly from this dashboard (add/edit/deactivate) is planned for the next
          iteration — for now, edit rows directly in the Supabase Table Editor under{" "}
          <code className="rounded bg-slate-100 px-1">sop_catalog</code>.
        </p>
      </main>
    </div>
  );
}
