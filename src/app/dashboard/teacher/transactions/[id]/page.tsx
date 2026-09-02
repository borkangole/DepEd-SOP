import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionSummaryCard from "@/components/TransactionSummaryCard";
import CorrectionBanner from "@/components/CorrectionBanner";
import DocumentList from "@/components/DocumentList";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import StatusHistoryTimeline from "@/components/StatusHistoryTimeline";
import { fetchTransactionById } from "@/lib/transactionDetail";
import { fetchDocumentsByTransaction } from "@/lib/documents";
import { fetchStatusHistory } from "@/lib/statusHistory";

export default async function TeacherTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
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
  // RLS (transactions_select_own_teacher) already limits this to the
  // caller's own transactions — a null here means "not found or not yours",
  // and we don't need to tell those two cases apart.
  if (!transaction) notFound();

  const [documentsByTransaction, history] = await Promise.all([
    fetchDocumentsByTransaction(supabase, [transaction.id]),
    fetchStatusHistory(supabase, transaction.id),
  ]);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Transaction Details"
        subtitle="Your submitted request"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to my transactions
        </Link>

        <TransactionSummaryCard transaction={transaction} />

        {transaction.current_status === "for_correction" && (
          <CorrectionBanner
            note={[...history].reverse().find((h) => h.status === "for_correction")?.note ?? null}
          />
        )}

        <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900">Attached documents</h3>
          <DocumentList documents={documentsByTransaction[transaction.id] ?? []} />
          <DocumentUploadForm transactionId={transaction.id} redirectPath={`/dashboard/teacher/transactions/${transaction.id}`} />
        </div>

        <div className="animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6" style={{ "--stagger-index": 1 } as React.CSSProperties}>
          <h3 className="mb-4 font-display text-sm font-semibold text-slate-900">Status history</h3>
          <StatusHistoryTimeline history={history} />
        </div>
      </main>
    </div>
  );
}
