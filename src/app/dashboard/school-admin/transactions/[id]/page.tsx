import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionSummaryCard from "@/components/TransactionSummaryCard";
import DocumentList from "@/components/DocumentList";
import StatusUpdateForm from "@/components/StatusUpdateForm";
import StatusHistoryTimeline from "@/components/StatusHistoryTimeline";
import { fetchTransactionById } from "@/lib/transactionDetail";
import { fetchDocumentsByTransaction } from "@/lib/documents";
import { fetchStatusHistory } from "@/lib/statusHistory";
import { SCHOOL_ADMIN_NEXT } from "@/lib/status";
import type { TransactionStatus } from "@/lib/types/database";

export default async function SchoolAdminTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
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
  // RLS (transactions_select_school_admin) already scopes this to the
  // caller's own school — null here means "not found or not from your school".
  if (!transaction) notFound();

  const [documentsByTransaction, history] = await Promise.all([
    fetchDocumentsByTransaction(supabase, [transaction.id]),
    fetchStatusHistory(supabase, transaction.id),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Transaction Details"
        subtitle="Verify and endorse this request"
        role="school_admin"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link href="/dashboard/school-admin" className="text-sm text-blue-700 hover:underline">
          ← Back to transactions
        </Link>

        <TransactionSummaryCard transaction={transaction} showRequester />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-medium text-slate-900">Attached documents</h3>
          <DocumentList documents={documentsByTransaction[transaction.id] ?? []} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-2 text-sm font-medium text-slate-900">Update status</h3>
          <StatusUpdateForm
            transactionId={transaction.id}
            options={SCHOOL_ADMIN_NEXT[transaction.current_status as TransactionStatus] ?? []}
            redirectPath={`/dashboard/school-admin/transactions/${transaction.id}`}
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
