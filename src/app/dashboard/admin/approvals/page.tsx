import { createClient } from "@/lib/supabase/server";
import PendingRegistrations from "@/components/PendingRegistrations";
import { fetchRegistrations } from "@/lib/registrations";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const [pending, rejected] = await Promise.all([
    fetchRegistrations(supabase, "super_admin", ["pending"]),
    fetchRegistrations(supabase, "super_admin", ["rejected"]),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Account approvals</h1>
        <p className="mt-1 text-sm text-slate-500">
          New accounts can&rsquo;t use the system until they&rsquo;re approved. School Admins approve their own
          teachers and Division approves School Admins &mdash; as Super Admin you can approve anyone, and you&rsquo;re
          the only one who can approve Division accounts.
        </p>
      </div>

      <PendingRegistrations
        accounts={pending}
        title="Waiting for approval"
        description="Oldest first. Check the name, school, and employee ID before approving."
        emptyText="No accounts are waiting for approval."
      />

      {rejected.length > 0 && (
        <PendingRegistrations
          accounts={rejected}
          mode="rejected"
          title="Rejected accounts"
          description="These accounts can't sign in to any dashboard. Approve one here if it was rejected by mistake."
        />
      )}
    </div>
  );
}
