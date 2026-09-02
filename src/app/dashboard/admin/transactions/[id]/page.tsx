import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionSummaryCard from "@/components/TransactionSummaryCard";
import DocumentList from "@/components/DocumentList";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import ScheduleForm from "@/components/ScheduleForm";
import StatusHistoryTimeline from "@/components/StatusHistoryTimeline";
import { fetchTransactionById } from "@/lib/transactionDetail";
import { fetchDocumentsByTransaction } from "@/lib/documents";
import { fetchStatusHistory } from "@/lib/statusHistory";
import { fullStatusOverride } from "@/lib/status";

// Super Admin gets a full status override — every other status is a valid
// target, regardless of the current one — rather than Division's staged
// next-status list. This matches "System-wide oversight": Super Admin can
// step in on a transaction stuck waiting on School Admin (still Submitted
// or Under Verification), not just ones already Endorsed to Division.
// RLS (status_log_insert_staff) already permits this for the super_admin
// role with no transition restriction; fullStatusOverride just exposes it here.
export default async function AdminTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const transaction = await fetchTransactionById(supabase, id);
  if (!transaction) notFound();

  const [documentsByTransaction, history] = await Promise.all([
    fetchDocumentsByTransaction(supabase, [transaction.id]),
    fetchStatusHistory(supabase, transaction.id),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/transactions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to transactions
      </Link>

      <TransactionSummaryCard transaction={transaction} showRequester />

      <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6">
        <h3 className="font-display text-sm font-semibold text-slate-900">Attached documents</h3>
        <DocumentList documents={documentsByTransaction[transaction.id] ?? []} />
      </div>

      <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6" style={{ "--stagger-index": 1 } as React.CSSProperties}>
        <h3 className="font-display text-sm font-semibold text-slate-900">Update status</h3>
        <p className="mt-0.5 mb-2 text-xs text-slate-500">
          As Super Admin, you can set this to any status directly — including skipping ahead of School
          Admin or Division if needed.
        </p>
        <StatusUpdateForm
          transactionId={transaction.id}
          options={fullStatusOverride(transaction.current_status)}
          redirectPath={`/dashboard/admin/transactions/${transaction.id}`}
        />
      </div>

      <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6" style={{ "--stagger-index": 2 } as React.CSSProperties}>
        <h3 className="mb-2 font-display text-sm font-semibold text-slate-900">Visit / pickup schedule</h3>
        <ScheduleForm
          transactionId={transaction.id}
          redirectPath={`/dashboard/admin/transactions/${transaction.id}`}
          scheduledDate={transaction.scheduled_date}
          scheduleNote={transaction.schedule_note}
        />
      </div>

      <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6" style={{ "--stagger-index": 3 } as React.CSSProperties}>
        <h3 className="mb-4 font-display text-sm font-semibold text-slate-900">Status history</h3>
        <StatusHistoryTimeline history={history} />
      </div>
    </div>
  );
}
