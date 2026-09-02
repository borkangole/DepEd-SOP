"use client";

import { useMemo, useState } from "react";
import TransactionListRow from "@/components/TransactionListRow";
import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";

type Row = {
  id: string;
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
  current_status: TransactionStatus;
  submitted_at: string;
  scheduled_date: string | null;
};

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "For Correction" },
];

function bucketOf(status: TransactionStatus): FilterKey {
  if (status === "approved_completed" || status === "released") return "approved";
  if (status === "for_correction") return "rejected";
  return "pending";
}

/**
 * Client-side filter tabs over the teacher's own transaction list — the
 * data is already fetched server-side (RLS-scoped to this teacher), this
 * just slices what's shown. Mirrors the same four buckets as the stat
 * cards above it, so clicking a tab feels like drilling into that number.
 */
export default function TeacherTransactionList({ transactions, basePath }: { transactions: Row[]; basePath: string }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: transactions.length, pending: 0, approved: 0, rejected: 0 };
    for (const t of transactions) c[bucketOf(t.current_status)]++;
    return c;
  }, [transactions]);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => bucketOf(t.current_status) === filter);

  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-[var(--brand)] text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-[var(--border-soft)] hover:bg-slate-50"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${filter === f.key ? "text-white/70" : "text-slate-400"}`}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {filter === "all" ? "You have no transactions yet." : "Nothing in this category right now."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {filtered.map((t, i) => (
              <li key={t.id}>
                <TransactionListRow href={`${basePath}/${t.id}`} transaction={t} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
