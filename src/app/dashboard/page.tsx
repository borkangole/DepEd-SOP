import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE_HOME: Record<string, string> = {
  teacher: "/dashboard/teacher",
  school_admin: "/dashboard/school-admin",
  division: "/dashboard/division",
  super_admin: "/dashboard/admin",
};

// This page only exists to route a signed-in user to the correct
// role-specific dashboard. Actual role enforcement happens twice more:
// in middleware.ts (route guard) and in RLS (database).
export default async function DashboardIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  redirect(ROLE_HOME[profile?.role ?? "teacher"] ?? "/dashboard/teacher");
}
