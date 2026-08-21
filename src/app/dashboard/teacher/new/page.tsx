import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/DashboardHeader";
import NewTransactionForm from "@/components/NewTransactionForm";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const { data: sopEntries } = await supabase
    .from("sop_catalog")
    .select("id, transaction_type, title, purpose, requirements, steps, processing_time_days")
    .eq("is_active", true)
    .order("title");

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="New Transaction" subtitle="Submit a request for review" />

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link href="/dashboard/teacher" className="text-sm text-blue-700 hover:underline">
          ← Back to my transactions
        </Link>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
          <NewTransactionForm sopEntries={sopEntries ?? []} />
        </div>
      </main>
    </div>
  );
}
