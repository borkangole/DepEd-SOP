import { createClient } from "@/lib/supabase/server";
import UsersDirectory from "@/components/UsersDirectory";
import type { UserRole } from "@/lib/types/database";

// Read-only directory — RLS (profiles_select_division_admin) already lets
// Super Admin (and Division) read every profile system-wide; there's no
// manage/update policy yet, so this is browse-and-search only for now.
export default async function UsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, employee_id, role, schools(name)")
    .order("full_name");

  const users = (profiles ?? []).map((p) => {
    const schoolName = Array.isArray(p.schools) ? p.schools[0]?.name : (p.schools as { name: string } | null)?.name;
    return {
      id: p.id,
      full_name: p.full_name,
      employee_id: p.employee_id,
      role: p.role as UserRole,
      schoolName: schoolName ?? null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Every registered account across the division, {users.length} total.</p>
      </div>

      <UsersDirectory users={users} />
    </div>
  );
}
