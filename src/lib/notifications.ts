import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationEntry = {
  id: string;
  transaction_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

/**
 * The most recent notifications for the signed-in user, plus how many are
 * unread. Rows are already being written for every status change by the
 * on_status_log_notify trigger (see 0001_init.sql) — this is the first
 * thing in the app that actually reads them back.
 *
 * RLS (notifications_select_own) already scopes this to the caller, so no
 * explicit user filter is required here, but we still limit to the current
 * user's rows to keep the query itself self-explanatory.
 */
export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<{ notifications: NotificationEntry[]; unreadCount: number }> {
  const [{ data: notifications }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, transaction_id, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  return {
    notifications: notifications ?? [],
    unreadCount: count ?? 0,
  };
}
