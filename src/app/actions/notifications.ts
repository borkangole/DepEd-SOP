"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Mark one notification read. RLS (notifications_update_own) already limits
// this to the caller's own rows, so no ownership check is needed here beyond
// requiring a signed-in user.
//
// Revalidates the whole app (path "/", type "layout") rather than a specific
// dashboard route, since the bell that calls this lives in DashboardHeader
// and is rendered from every role's dashboard and detail pages.
// ---------------------------------------------------------------------------
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Mark every one of the caller's notifications read (the "mark all read"
// action in the notification dropdown).
// ---------------------------------------------------------------------------
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/", "layout");
}
