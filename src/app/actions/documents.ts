"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateDocumentFile, saveDocumentToTransaction } from "@/lib/documents";

// ---------------------------------------------------------------------------
// Teacher: attach a supporting document to one of their own transactions,
// after it's already been submitted (e.g. adding something the School
// Administrative Officer asked for). RLS is the real security boundary —
// see saveDocumentToTransaction in @/lib/documents.
// ---------------------------------------------------------------------------
export async function uploadDocument(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const transactionId = String(formData.get("transaction_id") ?? "");
  const redirectPath = String(formData.get("redirect_path") ?? "/dashboard/teacher");
  const file = formData.get("file");

  if (!transactionId) return { error: "Missing transaction." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const validationError = validateDocumentFile(file);
  if (validationError) return { error: validationError };

  const result = await saveDocumentToTransaction(supabase, transactionId, user.id, file);
  if (result?.error) return result;

  revalidatePath(redirectPath);
  redirect(redirectPath);
}