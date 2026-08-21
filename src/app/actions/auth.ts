"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | never;

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns a specific error code when the account exists and the
    // password is correct, but the user hasn't clicked the confirmation link
    // in their email yet. Surface that distinctly instead of the generic
    // "invalid credentials" message — otherwise it looks like a typo'd
    // password when it's actually just an unconfirmed account.
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email first. Check your inbox (and spam folder) for a confirmation link from Supabase, then try signing in again.",
      };
    }
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Public self-registration is intentionally limited to "teacher" and
// "school_admin" roles. Division / Super Admin accounts carry more
// authority (processing transactions Division-wide, editing the SOP
// catalog) and should be provisioned directly by whoever administers
// the Supabase project — never through an open signup form.
export async function register(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const role = String(formData.get("role") ?? "teacher");
  const schoolId = String(formData.get("school_id") ?? "");

  if (!email || !password || !fullName || !schoolId) {
    return { error: "Please fill in all required fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "teacher" && role !== "school_admin") {
    return { error: "Invalid role for self-registration." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        employee_id: employeeId || null,
        role,
        school_id: schoolId,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?registered=1");
}