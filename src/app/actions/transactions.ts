"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";
import { validateDocumentFile, saveDocumentToTransaction } from "@/lib/documents";

// ---------------------------------------------------------------------------
// Teacher: submit a new transaction.
// RLS double-checks (transactions_insert_own_teacher) that teacher_id matches
// the caller and that the caller's role is actually 'teacher' — this action
// cannot be tricked into creating a transaction for someone else.
// ---------------------------------------------------------------------------
export async function submitTransaction(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher" || !profile.school_id) {
    return { error: "Only teachers with an assigned school may submit transactions." };
  }

  const transactionType = String(formData.get("transaction_type") ?? "") as TransactionType;
  const sopCatalogId = String(formData.get("sop_catalog_id") ?? "");
  const leaveKind = formData.get("leave_kind") ? (String(formData.get("leave_kind")) as LeaveKind) : null;
  const transferScope = formData.get("transfer_scope")
    ? (String(formData.get("transfer_scope")) as TransferScope)
    : null;
  const reason = String(formData.get("reason") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const destination = String(formData.get("destination") ?? "").trim();

  if (!transactionType || !sopCatalogId || !reason || !startDate || !endDate) {
    return { error: "Please fill in all required fields." };
  }
  // leave_kind / transfer_scope now come from whichever catalog entry the
  // teacher picked (each request type is its own dropdown option), rather
  // than a separate manual selection — these checks are a defensive
  // backstop in case that hidden field ever came through empty.
  if (transactionType === "leave_application" && !leaveKind) {
    return { error: "Missing leave type for this leave application — please re-select the transaction type." };
  }
  if (transactionType === "transfer_of_assignment" && !transferScope) {
    return { error: "Missing transfer category — please re-select the transaction type." };
  }

  // Validate any attached documents up front, before creating anything —
  // a bad file shouldn't leave behind a half-submitted transaction.
  const documentFiles = formData
    .getAll("documents")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of documentFiles) {
    const validationError = validateDocumentFile(file);
    if (validationError) return { error: validationError };
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      transaction_type: transactionType,
      leave_kind: leaveKind,
      transfer_scope: transferScope,
      sop_catalog_id: sopCatalogId,
      teacher_id: user.id,
      school_id: profile.school_id,
      details: { reason, start_date: startDate, end_date: endDate, destination },
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Failed to create transaction." };
  }

  // Best-effort: the transaction itself is already created at this point,
  // so a failed attachment doesn't block submission — the teacher can
  // still attach it afterwards from their dashboard.
  for (const file of documentFiles) {
    const result = await saveDocumentToTransaction(supabase, inserted.id, user.id, file);
    if (result?.error) {
      console.error(`Failed to attach "${file.name}" to transaction ${inserted.id}:`, result.error);
    }
  }

  revalidatePath("/dashboard/teacher");
  redirect("/dashboard/teacher");
}

// ---------------------------------------------------------------------------
// School Admin / Division: move a transaction to a new status.
// RLS (transactions_update_school_admin / transactions_update_division_admin,
// plus status_log_insert_staff) enforces that only the right role, for the
// right school, can actually write these rows — this action is a thin
// wrapper, not the security boundary.
// ---------------------------------------------------------------------------
export async function updateTransactionStatus(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const transactionId = String(formData.get("transaction_id") ?? "");
  const status = String(formData.get("status") ?? "") as TransactionStatus;
  const note = String(formData.get("note") ?? "").trim() || null;
  const redirectPath = String(formData.get("redirect_path") ?? "/dashboard");

  if (!transactionId || !status) {
    return { error: "Missing transaction or status." };
  }

  const { error } = await supabase.from("transaction_status_log").insert({
    transaction_id: transactionId,
    status,
    changed_by: user.id,
    note,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(redirectPath);
  redirect(redirectPath);
}