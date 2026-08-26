import Link from "next/link";
import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_COLOR, getTransactionLabel } from "@/lib/status";

type RowTransaction = {
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
  current_status: TransactionStatus;
  submitted_at: string;
};

export default function TransactionListRow({
  href,
  transaction,
  meta,
}: {
  href: string;
  transaction: RowTransaction;
  /** Extra context shown before the submitted date, e.g. "Juan Dela Cruz · Capiz East ES" */
  meta?: string;
}) {
  return (
    <Link href={href} className="block px-4 py-4 hover:bg-slate-50">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{getTransactionLabel(transaction)}</p>
          <p className="truncate text-xs text-slate-500">
            {meta ? `${meta} · ` : ""}
            Submitted {new Date(transaction.submitted_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[transaction.current_status]}`}
        >
          {STATUS_LABEL[transaction.current_status]}
        </span>
      </div>
    </Link>
  );
}