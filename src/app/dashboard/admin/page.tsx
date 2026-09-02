import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatCards from "@/components/StatCards";
import TransactionListRow from "@/components/TransactionListRow";
import AdminGlobalSearch, { type SearchItem } from "@/components/AdminGlobalSearch";
import type { TransactionStatus, UserRole } from "@/lib/types/database";
import { countDivisionStyleStats, getTransactionLabel } from "@/lib/status";

const ROLE_LABEL: Record<UserRole, string> = {
  teacher: "Teacher",
  school_admin: "School Admin",
  division: "Division Office",
  super_admin: "Super Admin",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK_LINKS = [
  {
    href: "/dashboard/admin/transactions",
    label: "Transactions",
    description: "Search, review, and override any request system-wide.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H8.5a2 2 0 00-1.4.6L4.6 7.1A2 2 0 004 8.5V18a2 2 0 002 2z"
      />
    ),
  },
  {
    href: "/dashboard/admin/sop-catalog",
    label: "SOP Catalog",
    description: "Add or update the requirements teachers see when filing.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    ),
  },
  {
    href: "/dashboard/admin/schools",
    label: "Schools",
    description: "Manage the schools that appear on the registration page.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
      />
    ),
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    description: "See every registered account across the division.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-4-4"
      />
    ),
  },
];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const [{ data: transactions }, { data: schools }, { data: users }] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, scheduled_date, profiles!transactions_teacher_id_fkey(full_name), schools(name)"
      )
      .order("submitted_at", { ascending: false }),
    supabase.from("schools").select("id, name, district").order("name"),
    supabase.from("profiles").select("id, full_name, role, schools(name)").order("full_name"),
  ]);

  const stats = countDivisionStyleStats(
    (transactions ?? []).map((t) => ({ current_status: t.current_status as TransactionStatus }))
  );

  // The oldest still-unactioned requests — the ones most likely to need a
  // nudge or a Super Admin override, surfaced right on the landing page
  // instead of requiring a trip into the full Transactions list.
  const needsAttention = (transactions ?? [])
    .filter((t) => t.current_status === "submitted" || t.current_status === "under_verification")
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
    .slice(0, 5);

  // One flat, searchable index across everything Super Admin manages — fed
  // into the search box below. All three lists are already loaded for the
  // stats/quick-links above, so this is just relabeling, not extra queries.
  const searchItems: SearchItem[] = [
    ...(transactions ?? []).map((t): SearchItem => {
      const teacherName = Array.isArray(t.profiles) ? t.profiles[0]?.full_name : (t.profiles as { full_name: string } | null)?.full_name;
      const schoolName = Array.isArray(t.schools) ? t.schools[0]?.name : (t.schools as { name: string } | null)?.name;
      return {
        id: t.id,
        kind: "transaction",
        label: getTransactionLabel(t),
        sublabel: `${teacherName ?? "Unknown"} · ${schoolName ?? "Unknown school"}`,
        href: `/dashboard/admin/transactions/${t.id}`,
        status: t.current_status as TransactionStatus,
      };
    }),
    ...(schools ?? []).map((s): SearchItem => ({
      id: s.id,
      kind: "school",
      label: s.name,
      sublabel: s.district ?? "District not set",
      href: "/dashboard/admin/schools",
    })),
    ...(users ?? []).map((u): SearchItem => {
      const schoolName = Array.isArray(u.schools) ? u.schools[0]?.name : (u.schools as { name: string } | null)?.name;
      return {
        id: u.id,
        kind: "user",
        label: u.full_name,
        sublabel: `${ROLE_LABEL[u.role as UserRole]}${schoolName ? ` · ${schoolName}` : ""}`,
        href: "/dashboard/admin/users",
      };
    }),
  ];

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-slate-500">{today}</p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&rsquo;s how the system looks across the whole division.</p>
      </div>

      <div className="mb-6">
        <AdminGlobalSearch items={searchItems} />
      </div>

      <StatCards
        stats={[
          { label: "Schools", value: schools?.length ?? 0, icon: "schools" },
          { label: "Users", value: users?.length ?? 0, icon: "users" },
          { label: "Total", value: stats.total, icon: "total" },
          { label: "Pending", value: stats.pending, accent: "text-amber-600", icon: "pending" },
          { label: "Processing", value: stats.processing, accent: "text-indigo-600", icon: "processing" },
          { label: "Approved", value: stats.approved, accent: "text-green-600", icon: "approved" },
          { label: "For Correction", value: stats.rejected, accent: "text-red-600", icon: "rejected" },
        ]}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            style={{ "--stagger-index": i } as React.CSSProperties}
            className="hover-lift animate-in group flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px]">
                {link.icon}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {link.label}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">Needs attention</h2>
            <p className="text-xs text-slate-500">Oldest requests still waiting on School Admin verification.</p>
          </div>
          <Link href="/dashboard/admin/transactions" className="text-xs font-medium text-[var(--brand)] hover:underline">
            View all →
          </Link>
        </div>
        {needsAttention.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing waiting — the queue is clear.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {needsAttention.map((t, i) => (
              <li key={t.id}>
                <TransactionListRow href={`/dashboard/admin/transactions/${t.id}`} transaction={t} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
