import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/types/database";

export type RegistrationEntry = {
  id: string;
  full_name: string;
  employee_id: string | null;
  role: UserRole;
  status: AccountStatus;
  schoolName: string | null;
  created_at: string;
};

// Which roles each reviewer can approve — must match review_registration()
// in 0009_registration_approval.sql (the database is the real gate; this
// just keeps the list to accounts the reviewer can actually act on).
export const REVIEWABLE_ROLES: Record<UserRole, UserRole[]> = {
  teacher: [],
  school_admin: ["teacher"],
  division: ["teacher", "school_admin"],
  super_admin: ["teacher", "school_admin", "division", "super_admin"],
};

/**
 * Accounts in the given status(es) that this reviewer can act on. RLS
 * already limits which profiles are visible (a School Admin only sees their
 * own school), so this only narrows by role.
 */
export async function fetchRegistrations(
  supabase: SupabaseClient,
  reviewerRole: UserRole,
  statuses: AccountStatus[] = ["pending"]
): Promise<RegistrationEntry[]> {
  const roles = REVIEWABLE_ROLES[reviewerRole];
  if (roles.length === 0) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, employee_id, role, status, created_at, schools(name)")
    .in("status", statuses)
    .in("role", roles)
    .order("created_at", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    employee_id: p.employee_id,
    role: p.role as UserRole,
    status: p.status as AccountStatus,
    schoolName: Array.isArray(p.schools)
      ? (p.schools[0]?.name ?? null)
      : ((p.schools as { name: string } | null)?.name ?? null),
    created_at: p.created_at,
  }));
}
