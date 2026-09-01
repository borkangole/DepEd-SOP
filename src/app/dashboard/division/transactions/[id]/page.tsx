import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionSummaryCard from "@/components/TransactionSummaryCard";
import DocumentList from "@/components/DocumentList";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import ScheduleForm from "@/components/ScheduleForm";
import StatusHistoryTimeline from "@/components/StatusHistoryTimeline";
import { fetchTransactionById } from "@/lib/transactionDetail";
import { fetchDocumentsByTransaction } from "@/lib/documents";
import { fetchStatusHistory } from "@/lib/statusHistory";
import { fullStatusOverride } from "@/lib/status";

// Division gets a full status override — every other status is a valid
// target, regardless of the current one — rather than being blocked until
// School Admin has verified and endorsed a transaction. Lets Division step
// in directly on one stuck earlier in the chain (e.g. a School Admin
// account is unavailable), without waiting.
// RLS (status_log_insert_staff) already permits this for the division role
// with no transition restriction; fullStatusOverride just exposes it here.

export default async function DivisionTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const transaction = await fetchTransactionById(supabase, id);
  if (!transaction) notFound();

  const [documentsByTransaction, history] = await Promise.all([
    fetchDocumentsByTransaction(supabase, [transaction.id]),
    fetchStatusHistory(supabase, transaction.id),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Transaction Details"
        subtitle="Process this request"
        role="division"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link href="/dashboard/division" className="text-sm text-blue-700 hover:underline">
          ← Back to transactions
        </Link>

        <TransactionSummaryCard transaction={transaction} showRequester />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-900">Attached documents</h3>
          <DocumentList documents={documentsByTransaction[transaction.id] ?? []} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-900">Update status</h3>
          <p className="mt-0.5 mb-2 text-xs text-slate-500">
            You can set this to any status directly — including skipping ahead of School Admin if needed.
          </p>
          <StatusUpdateForm
            transactionId={transaction.id}
            options={fullStatusOverride(transaction.current_status)}
            redirectPath={`/dashboard/division/transactions/${transaction.id}`}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-2 text-sm font-medium text-slate-900">Visit / pickup schedule</h3>
          <ScheduleForm
            transactionId={transaction.id}
            redirectPath={`/dashboard/division/transactions/${transaction.id}`}
            scheduledDate={transaction.scheduled_date}
            scheduleNote={transaction.schedule_note}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-900">Status history</h3>
          <StatusHistoryTimeline history={history} />
        </div>
      </main>
    </div>
  );
}
