import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import NewTransactionForm from "@/components/NewTransactionForm";

export default async function NewTransactionPage() {
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
    .select("id, transaction_type, leave_kind, transfer_scope, title, purpose, requirements, steps, processing_time_days")
    .eq("is_active", true)
    .order("title");

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="New Transaction"
        subtitle="Submit a request for review"
        role="teacher"
        userName={profile?.full_name}
      />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to my transactions
        </Link>

        <div className="animate-in mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6">
          <NewTransactionForm sopEntries={sopEntries ?? []} />
        </div>
      </main>
    </div>
  );
}