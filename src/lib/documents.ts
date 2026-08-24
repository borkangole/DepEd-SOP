import type { SupabaseClient } from "@supabase/supabase-js";

export type DocumentWithUrl = {
  id: string;
  transaction_id: string;
  file_name: string;
  uploaded_at: string;
  url: string | null;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Returns an error message if the file fails validation, otherwise null. */
export function validateDocumentFile(file: File): string | null {
  if (file.size === 0) return "That file appears to be empty.";
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" is too large — max 10MB.`;
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return `"${file.name}" is an unsupported file type. Use PDF, Word, or an image (JPG/PNG/HEIC).`;
  }
  return null;
}

/**
 * Uploads one file to the transaction-documents bucket and records it in
 * transaction_documents. RLS (documents_insert_teacher_own /
 * storage_insert_teacher_own) independently re-checks that the caller is
 * the owning teacher for this transaction_id before allowing either write
 * — this is a thin wrapper, not the security boundary.
 */
export async function saveDocumentToTransaction(
  supabase: SupabaseClient,
  transactionId: string,
  uploadedBy: string,
  file: File
): Promise<{ error: string } | void> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${transactionId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("transaction-documents")
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("transaction_documents").insert({
    transaction_id: transactionId,
    storage_path: storagePath,
    file_name: file.name,
    uploaded_by: uploadedBy,
  });

  if (insertError) {
    // Roll back the uploaded object so a rejected insert (e.g. RLS refusing
    // a transaction that isn't actually the caller's) doesn't leave an
    // orphaned file sitting in storage.
    await supabase.storage.from("transaction-documents").remove([storagePath]);
    return { error: insertError.message };
  }
}

// How long a "View" link stays valid after the page is rendered. The bucket
// is private (see migration 0001) — every link is a fresh signed URL, never
// a permanent public one.
const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * Fetches transaction_documents for the given transaction ids and attaches a
 * fresh signed URL to each one, grouped by transaction_id for easy lookup
 * when rendering a list of transactions.
 *
 * RLS (documents_select_related / storage_select_related) already scopes
 * which rows/objects the caller can see — this just shapes the result for
 * the UI, it isn't itself a security boundary.
 */
export async function fetchDocumentsByTransaction(
  supabase: SupabaseClient,
  transactionIds: string[]
): Promise<Record<string, DocumentWithUrl[]>> {
  if (transactionIds.length === 0) return {};

  const { data: docs } = await supabase
    .from("transaction_documents")
    .select("id, transaction_id, storage_path, file_name, uploaded_at")
    .in("transaction_id", transactionIds)
    .order("uploaded_at", { ascending: false });

  if (!docs || docs.length === 0) return {};

  const withUrls = await Promise.all(
    docs.map(async (d) => {
      const { data: signed } = await supabase.storage
        .from("transaction-documents")
        .createSignedUrl(d.storage_path, SIGNED_URL_TTL_SECONDS);

      return {
        id: d.id as string,
        transaction_id: d.transaction_id as string,
        file_name: d.file_name as string,
        uploaded_at: d.uploaded_at as string,
        url: signed?.signedUrl ?? null,
      };
    })
  );

  const grouped: Record<string, DocumentWithUrl[]> = {};
  for (const d of withUrls) {
    (grouped[d.transaction_id] ??= []).push(d);
  }
  return grouped;
}