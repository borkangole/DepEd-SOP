"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Super Admin: add a new school to the catalog. Once inserted, it shows up
// immediately in the /register school dropdown (that page reads directly
// from the schools table on every render) and everywhere else schools are
// listed — no separate wiring needed.
//
// RLS (schools_manage_super_admin) is the real gate; the role check here
// just gives a clean error message instead of a silent RLS denial.
// ---------------------------------------------------------------------------
export async function createSchool(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return { error: "Only Super Admin can add schools." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim() || null;
  const isRemote = formData.get("is_remote") === "on";

  if (!name) {
    return { error: "School name is required." };
  }

  const { error } = await supabase.from("schools").insert({ name, district, is_remote: isRemote });

  if (error) {
    // Most likely cause: a school with this name already exists, if a
    // uniqueness constraint is ever added — surfaced as-is either way.
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/schools");
  revalidatePath("/dashboard/admin");
  revalidatePath("/register");
}
