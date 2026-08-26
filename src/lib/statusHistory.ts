import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionStatus } from "@/lib/types/database";

export type StatusHistoryEntry = {
  id: string;
  status: TransactionStatus;
  note: string | null;
  changed_at: string;
  actor_name: string;
};

/**
 * Full audit trail for a single transaction, oldest first, with the actor's
 * name resolved — nothing today surfaces transaction_status_log to users,
 * even though every status change has already been recorded there since
 * day one via the update forms.
 */
export async function fetchStatusHistory(
  supabase: SupabaseClient,
  transactionId: string
): Promise<StatusHistoryEntry[]> {
  const { data } = await supabase
    .from("transaction_status_log")
    .select("id, status, note, changed_at, profiles!transaction_status_log_changed_by_fkey(full_name)")
    .eq("transaction_id", transactionId)
    .order("changed_at", { ascending: true });

  return (data ?? []).map((row) => {
    const actor = Array.isArray(row.profiles)
      ? row.profiles[0]
      : (row.profiles as { full_name: string } | null);
    return {
      id: row.id,
      status: row.status,
      note: row.note,
      changed_at: row.changed_at,
      actor_name: actor?.full_name ?? "Unknown",
    };
  });
}