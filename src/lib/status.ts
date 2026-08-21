import type { TransactionStatus } from "@/lib/types/database";

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
