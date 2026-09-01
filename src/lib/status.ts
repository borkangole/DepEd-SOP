import type { TransactionStatus, TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  submitted: "Submitted",
  under_verification: "Under Verification",
  for_correction: "For Correction",
  endorsed: "Endorsed",
  under_processing: "Under Processing",
  approved_completed: "Approved / Completed",
  released: "Released",
};

export const STATUS_COLOR: Record<TransactionStatus, string> = {
  submitted: "bg-slate-100 text-slate-700",
  under_verification: "bg-amber-100 text-amber-800",
  for_correction: "bg-red-100 text-red-700",
  endorsed: "bg-blue-100 text-blue-700",
  under_processing: "bg-indigo-100 text-indigo-700",
  approved_completed: "bg-green-100 text-green-700",
  released: "bg-emerald-100 text-emerald-800",
};

// Which statuses a School Admin is allowed to move a transaction into,
// from its current status. Enforced here for a sane UI; the database
// (RLS) only checks role + school, so keep this list authoritative
// for what "makes sense" procedurally.
export const SCHOOL_ADMIN_NEXT: Partial<Record<TransactionStatus, TransactionStatus[]>> = {
  submitted: ["under_verification"],
  under_verification: ["for_correction", "endorsed"],
  for_correction: ["under_verification"], // after teacher resubmits/corrects
};

export const DIVISION_NEXT: Partial<Record<TransactionStatus, TransactionStatus[]>> = {
  endorsed: ["under_processing"],
  under_processing: ["approved_completed", "for_correction"],
  approved_completed: ["released"],
};

// Every status a transaction can be in, in the order the SOP workflow
// normally moves through them. Used to build Super Admin's full override.
const ALL_STATUSES: TransactionStatus[] = [
  "submitted",
  "under_verification",
  "for_correction",
  "endorsed",
  "under_processing",
  "approved_completed",
  "released",
];

/**
 * Full override: every other status is a valid target, regardless of the
 * current one — bypassing SCHOOL_ADMIN_NEXT / DIVISION_NEXT's staged
 * hand-off. Used by both Division and Super Admin, so either office can
 * step in on a transaction stuck earlier in the chain (e.g. still
 * "Submitted" or "Under Verification" because a School Admin account is
 * unavailable) instead of being blocked until School Admin acts.
 * RLS already allows this at the database level (status_log_insert_staff
 * has no transition restriction for division/super_admin) — this just
 * exposes it in the UI.
 */
export function fullStatusOverride(current: TransactionStatus): TransactionStatus[] {
  return ALL_STATUSES.filter((s) => s !== current);
}

// ---------------------------------------------------------------------------
// Dashboard stat cards
// ---------------------------------------------------------------------------
// Teacher and School Admin dashboards share the same 4-card layout: Total,
// Pending, Approved, Rejected. "Pending" here bundles every in-flight status
// (submitted, under_verification, endorsed, under_processing) since from a
// teacher's or a single school's point of view, all of those just mean "not
// done yet" — the finer-grained Processing bucket only matters division-wide.
export function countTeacherStyleStats(transactions: { current_status: TransactionStatus }[]) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const t of transactions) {
    if (t.current_status === "approved_completed" || t.current_status === "released") approved++;
    else if (t.current_status === "for_correction") rejected++;
    else pending++;
  }
  return { total: transactions.length, pending, approved, rejected };
}

// Division and Super Admin dashboards get a 5th card, "Processing", to
// distinguish requests still sitting with the school (Pending) from ones
// already in the Division Office's hands (Processing).
export function countDivisionStyleStats(transactions: { current_status: TransactionStatus }[]) {
  let pending = 0;
  let processing = 0;
  let approved = 0;
  let rejected = 0;
  for (const t of transactions) {
    if (t.current_status === "approved_completed" || t.current_status === "released") approved++;
    else if (t.current_status === "for_correction") rejected++;
    else if (t.current_status === "endorsed" || t.current_status === "under_processing") processing++;
    else pending++; // submitted, under_verification
  }
  return { total: transactions.length, pending, processing, approved, rejected };
}

export const TRANSFER_SCOPE_LABEL: Record<TransferScope, string> = {
  teaching_school_to_school: "Teaching Personnel, School to School",
  non_teaching_or_senior_hs: "Non-Teaching Personnel",
  other_division_agency: "Other Division/Agency",
};

/**
 * Human-readable label for a transaction row, shared across all dashboards
 * so the four transaction types (and their leave/transfer variants) are
 * always described the same way.
 */
export function getTransactionLabel(t: {
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
}): string {
  if (t.transaction_type === "authority_to_travel") {
    return "Authority to Travel";
  }
  if (t.transaction_type === "leave_application") {
    return `Leave Application (${t.leave_kind === "maternity" ? "Maternity" : "Leave Credits"})`;
  }
  if (t.transaction_type === "transfer_of_assignment") {
    const scopeLabel = t.transfer_scope ? TRANSFER_SCOPE_LABEL[t.transfer_scope] : null;
    return `Transfer of Assignment${scopeLabel ? ` — ${scopeLabel}` : ""}`;
  }
  return t.transaction_type;
}