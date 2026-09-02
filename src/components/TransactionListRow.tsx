import Link from "next/link";
import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_COLOR, getTransactionLabel } from "@/lib/status";

type RowTransaction = {
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
  current_status: TransactionStatus;
  submitted_at: string;
  scheduled_date?: string | null;
};

// One glyph per transaction type, so a list is scannable at a glance rather
// than pure text — kept intentionally simple (no icon library dependency).
const TYPE_ICON: Record<TransactionType, string> = {
  authority_to_travel: "✈",
  leave_application: "🗓",
  transfer_of_assignment: "⇄",
};

const TYPE_ICON_BG: Record<TransactionType, string> = {
  authority_to_travel: "bg-sky-50 text-sky-700",
  leave_application: "bg-violet-50 text-violet-700",
  transfer_of_assignment: "bg-amber-50 text-amber-700",
};

export default function TransactionListRow({
  href,
  transaction,
  meta,
  index = 0,
}: {
  href: string;
  transaction: RowTransaction;
  /** Extra context shown before the submitted date, e.g. "Juan Dela Cruz · Capiz East ES" */
  meta?: string;
  /** Position in the list, for a subtle staggered entrance animation. */
  index?: number;
}) {
  return (
    <Link
      href={href}
      className="animate-in group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--brand)_4%,white)]"
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${TYPE_ICON_BG[transaction.transaction_type]}`}
        aria-hidden
      >
        {TYPE_ICON[transaction.transaction_type]}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-[var(--brand)]">
          {getTransactionLabel(transaction)}
        </p>
        <p className="truncate text-xs text-slate-500">
          {meta ? `${meta} · ` : ""}
          Submitted {new Date(transaction.submitted_at).toLocaleDateString()}
        </p>
        {transaction.scheduled_date && (
          <p className="mt-0.5 truncate text-xs font-medium text-emerald-700">
            📅{" "}
            {new Date(transaction.scheduled_date + "T00:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[transaction.current_status]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
        {STATUS_LABEL[transaction.current_status]}
      </span>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
