"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";

// Paths that read from sop_catalog and need to reflect a change immediately:
// the Super Admin dashboard's own list, and the teacher's "New Transaction"
// dropdown (which only shows is_active = true entries).
function revalidateSopPaths() {
  revalidatePath("/dashboard/admin/sop-catalog");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher/new");
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not signed in." } as const;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return { supabase, error: "Only Super Admin can manage the SOP catalog." } as const;
  }
  return { supabase, userId: user.id, error: null } as const;
}

// Splits a textarea's lines into a clean string array — used for both
// `requirements` and `steps`, which are stored as Postgres text[] columns.
function linesToArray(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// ---------------------------------------------------------------------------
// Create a new SOP catalog entry. transaction_type (+ leave_kind /
// transfer_scope, when applicable) defines which slot in the teacher's
// "New Transaction" dropdown this becomes — see NewTransactionForm, which
// keys entirely off sop_catalog rows.
// ---------------------------------------------------------------------------
export async function createSopEntry(formData: FormData): Promise<{ error: string } | void> {
  const { supabase, userId, error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const transactionType = String(formData.get("transaction_type") ?? "") as TransactionType;
  const leaveKind = formData.get("leave_kind") ? (String(formData.get("leave_kind")) as LeaveKind) : null;
  const transferScope = formData.get("transfer_scope")
    ? (String(formData.get("transfer_scope")) as TransferScope)
    : null;
  const title = String(formData.get("title") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const responsibleOffices = String(formData.get("responsible_offices") ?? "").trim();
  const processingTimeDays = Number(formData.get("processing_time_days") ?? 0);
  const requirements = linesToArray(formData.get("requirements"));
  const steps = linesToArray(formData.get("steps"));

  if (!transactionType || !title || !purpose) {
    return { error: "Transaction type, title, and purpose are required." };
  }
  if (transactionType === "leave_application" && !leaveKind) {
    return { error: "Select a leave type (Maternity or Leave Credits)." };
  }
  if (transactionType === "transfer_of_assignment" && !transferScope) {
    return { error: "Select a transfer scope." };
  }
  if (!Number.isFinite(processingTimeDays) || processingTimeDays < 0) {
    return { error: "Processing time must be a non-negative number of days." };
  }

  const { error } = await supabase.from("sop_catalog").insert({
    transaction_type: transactionType,
    leave_kind: leaveKind,
    transfer_scope: transferScope,
    title,
    purpose,
    requirements,
    steps,
    responsible_offices: responsibleOffices,
    processing_time_days: processingTimeDays,
    is_active: true,
    updated_by: userId,
  });

  if (error) return { error: error.message };

  revalidateSopPaths();
}

// ---------------------------------------------------------------------------
// Edit an existing entry's content. Deliberately does NOT touch
// transaction_type / leave_kind / transfer_scope — those define which
// teacher-facing slot this entry fills, and changing them on an entry that
// existing transactions already reference (via sop_catalog_id) would be
// confusing; treat that as "deactivate this, create a new one" instead.
// ---------------------------------------------------------------------------
export async function updateSopEntry(formData: FormData): Promise<{ error: string } | void> {
  const { supabase, userId, error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const responsibleOffices = String(formData.get("responsible_offices") ?? "").trim();
  const processingTimeDays = Number(formData.get("processing_time_days") ?? 0);
  const requirements = linesToArray(formData.get("requirements"));
  const steps = linesToArray(formData.get("steps"));

  if (!id || !title || !purpose) {
    return { error: "Title and purpose are required." };
  }
  if (!Number.isFinite(processingTimeDays) || processingTimeDays < 0) {
    return { error: "Processing time must be a non-negative number of days." };
  }

  const { error } = await supabase
    .from("sop_catalog")
    .update({
      title,
      purpose,
      requirements,
      steps,
      responsible_offices: responsibleOffices,
      processing_time_days: processingTimeDays,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateSopPaths();
}

// ---------------------------------------------------------------------------
// Toggle an entry active/inactive. Deactivating removes it from the
// teacher's "New Transaction" dropdown (that query filters is_active=true)
// without deleting history — past transactions filed against it are
// unaffected, since they reference the row by id, not by is_active state.
// ---------------------------------------------------------------------------
export async function toggleSopEntryActive(formData: FormData): Promise<{ error: string } | void> {
  const { supabase, userId, error: authError } = await requireSuperAdmin();
  if (authError) return { error: authError };

  const id = String(formData.get("id") ?? "");
  const nextActive = String(formData.get("next_active") ?? "") === "true";

  if (!id) return { error: "Missing SOP entry." };

  const { error } = await supabase
    .from("sop_catalog")
    .update({ is_active: nextActive, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateSopPaths();
}
