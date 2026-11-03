import { getSession } from "@/lib/session";
import AdminShell from "@/components/AdminShell";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/LogoutButton";

// Shared chrome for every Super Admin route: sidebar nav + top bar. Each
// page under /dashboard/admin/* only needs to render its own content —
// this fetches the two things the shell itself needs (display name, and
// a "needs attention" count for the Transactions nav badge) once, up top.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await getSession();

  // Both badge counts in parallel: transactions still at the earliest
  // stages (Transactions nav) and accounts waiting for approval (Approvals).
  const [{ count: pendingCount }, { count: approvalsCount }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .in("current_status", ["submitted", "under_verification"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <AdminShell
      userName={profile?.full_name}
      pendingCount={pendingCount ?? 0}
      approvalsCount={approvalsCount ?? 0}
      notificationBell={<NotificationBell />}
      logoutButton={<LogoutButton />}
    >
      {children}
    </AdminShell>
  );
}
