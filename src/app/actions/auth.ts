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

// Self-registration is open to "teacher", "school_admin" and "division",
// but every new account starts as PENDING and can't use the system until
// an approver accepts it (see 0009_registration_approval.sql): School Admin
// approves teachers in their school, Division approves School Admins, and
// Super Admin approves Division accounts. The role sent here is only a
// request — the database ignores anything outside those three roles, so
// Super Admin can never be self-registered.
export async function register(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const role = String(formData.get("role") ?? "teacher");
  const schoolId = String(formData.get("school_id") ?? "");

  if (!email || !password || !fullName || !employeeId || !schoolId) {
    return { error: "Please fill in all required fields." };
  }
  // Same rule is enforced in the database (0010_require_deped_email.sql);
  // this just gives a friendly message before Supabase is even called.
  if (!email.toLowerCase().endsWith("@deped.gov.ph")) {
    return { error: "Please register with your official DepEd email (ending in @deped.gov.ph)." };
  }
    if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "teacher" && role !== "school_admin" && role !== "division") {
    return { error: "Invalid role for self-registration." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        employee_id: employeeId,
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