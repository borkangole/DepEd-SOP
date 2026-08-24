import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import DocumentList from "@/components/DocumentList";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import type { TransactionStatus } from "@/lib/types/database";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/status";
import { fetchDocumentsByTransaction } from "@/lib/documents";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, transaction_type, leave_kind, current_status, submitted_at")
    .eq("teacher_id", user!.id)
    .order("submitted_at", { ascending: false });

  const documentsByTransaction = await fetchDocumentsByTransaction(
    supabase,
    (transactions ?? []).map((t) => t.id)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Teacher Dashboard"
        subtitle="Your submitted transactions"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900">My Transactions</h2>
          <Link
            href="/dashboard/teacher/new"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            + New Transaction
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {!transactions || transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              You have no transactions yet. Click &ldquo;New Transaction&rdquo; to submit your first one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <li key={t.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {t.transaction_type === "authority_to_travel"
                          ? "Authority to Travel"
                          : `Leave Application (${t.leave_kind === "maternity" ? "Maternity" : "Leave Credits"})`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Submitted {new Date(t.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[(t.current_status as TransactionStatus)]}`}
                    >
                      {STATUS_LABEL[(t.current_status as TransactionStatus)]}
                    </span>
                  </div>

                  <DocumentList documents={documentsByTransaction[t.id] ?? []} />
                  <DocumentUploadForm transactionId={t.id} redirectPath="/dashboard/teacher" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
