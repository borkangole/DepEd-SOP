import { getSession } from "@/lib/session";
import { fetchNotifications } from "@/lib/notifications";
import NotificationBellClient from "@/components/NotificationBellClient";
import type { UserRole } from "@/lib/types/database";

// Each role has its own transaction detail route; a notification just has a
// transaction_id, so the bell needs to know which base path to link into.
const DETAIL_BASE_PATH: Record<UserRole, string> = {
  teacher: "/dashboard/teacher/transactions",
  school_admin: "/dashboard/school-admin/transactions",
  division: "/dashboard/division/transactions",
  super_admin: "/dashboard/admin/transactions",
};

// Where a notification that isn't about a transaction (e.g. "new
// registration waiting for approval") should take each role.
const GENERAL_PATH: Record<UserRole, string> = {
  teacher: "/dashboard/teacher",
  school_admin: "/dashboard/school-admin",
  division: "/dashboard/division",
  super_admin: "/dashboard/admin/approvals",
};

/**
 * Server-side wrapper: resolves the signed-in user and fetches their
 * notifications, then hands the data to the interactive client piece.
 * Rendered unconditionally from DashboardHeader — if there's no signed-in
 * user (shouldn't happen on a dashboard page, but defensively) it renders
 * nothing rather than throwing.
 */
export default async function NotificationBell() {
  // Shares the page's cached session — no extra auth/profile round trips.
  const { supabase, user, profile } = await getSession();
  if (!user) return null;

  const { notifications, unreadCount } = await fetchNotifications(supabase, user.id);

  const role = (profile?.role as UserRole | undefined) ?? "teacher";

  return (
    <NotificationBellClient
      notifications={notifications}
      unreadCount={unreadCount}
      detailBasePath={DETAIL_BASE_PATH[role]}
      generalPath={GENERAL_PATH[role]}
    />
  );
}
