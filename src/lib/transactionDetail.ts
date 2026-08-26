import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";

export type TransactionDetail = {
  id: string;
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
  current_status: TransactionStatus;
  submitted_at: string;
  details: Record<string, unknown>;
  teacher_id: string;
  school_id: string;
  teacher_name: string;
  school_name: string;
  sop: {
    title: string;
    purpose: string;
    requirements: string[];
    steps: string[];
    processing_time_days: number;
  } | null;
};

/**
 * Fetch one transaction with everything a detail page needs to render:
 * requester/school names and the SOP catalog entry it was filed against
 * (for the requirements checklist). RLS is the actual access boundary —
 * this returns null both when the row doesn't exist and when the caller
 * isn't allowed to see it, and the page should treat both the same way
 * (notFound()) rather than trying to tell them apart.
 */
export async function fetchTransactionById(
  supabase: SupabaseClient,
  id: string
): Promise<TransactionDetail | null> {
  const { data } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, leave_kind, transfer_scope, current_status, submitted_at, details, teacher_id, school_id, profiles!transactions_teacher_id_fkey(full_name), schools(name), sop_catalog(title, purpose, requirements, steps, processing_time_days)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const teacher = Array.isArray(data.profiles) ? data.profiles[0] : (data.profiles as { full_name: string } | null);
  const school = Array.isArray(data.schools) ? data.schools[0] : (data.schools as { name: string } | null);
  const sop = Array.isArray(data.sop_catalog) ? data.sop_catalog[0] : data.sop_catalog;

  return {
    id: data.id,
    transaction_type: data.transaction_type,
    leave_kind: data.leave_kind,
    transfer_scope: data.transfer_scope,
    current_status: data.current_status,
    submitted_at: data.submitted_at,
    details: (data.details as Record<string, unknown>) ?? {},
    teacher_id: data.teacher_id,
    school_id: data.school_id,
    teacher_name: teacher?.full_name ?? "Unknown",
    school_name: school?.name ?? "Unknown school",
    sop: sop
      ? {
          title: sop.title,
          purpose: sop.purpose,
          requirements: sop.requirements,
          steps: sop.steps,
          processing_time_days: sop.processing_time_days,
        }
      : null,
  };
}