import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/AdminShell";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/LogoutButton";

// Shared chrome for every Super Admin route: sidebar nav + top bar. Each
// page under /dashboard/admin/* only needs to render its own content —
// this fetches the two things the shell itself needs (display name, and
// a "needs attention" count for the Transactions nav badge) once, up top.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  // Transactions still sitting at the earliest stages — the ones most
  // likely to need a Super Admin nudge or override.
  const { count: pendingCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .in("current_status", ["submitted", "under_verification"]);

  return (
    <AdminShell
      userName={profile?.full_name}
      pendingCount={pendingCount ?? 0}
      notificationBell={<NotificationBell />}
      logoutButton={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
