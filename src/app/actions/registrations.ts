"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Thin wrapper: all the "who may approve whom" rules live in the
// review_registration() database function, which also notifies the person.
export async function reviewRegistration(
  accountId: string,
  decision: "approved" | "rejected"
): Promise<{ error: string }> {
  if (!accountId) return { error: "Missing account." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_registration", { target: accountId, decision });
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { error: "" };
}
