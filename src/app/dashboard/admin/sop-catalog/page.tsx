import { createClient } from "@/lib/supabase/server";
import SopCatalogSection from "@/components/SopCatalogSection";

export default async function SopCatalogPage() {
  const supabase = await createClient();

  const { data: sopEntries } = await supabase
    .from("sop_catalog")
    .select(
      "id, transaction_type, leave_kind, transfer_scope, title, purpose, requirements, steps, responsible_offices, processing_time_days, is_active"
    )
    .order("title");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">SOP Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">
          What teachers see when they file a request — requirements, steps, and processing time.
        </p>
      </div>

      <SopCatalogSection entries={sopEntries ?? []} />
    </div>
  );
}
