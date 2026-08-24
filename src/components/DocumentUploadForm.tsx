"use client";

import { useActionState, useState } from "react";
import { uploadDocument } from "@/app/actions/documents";

const initialState: { error: string } = { error: "" };

export default function DocumentUploadForm({
  transactionId,
  redirectPath,
}: {
  transactionId: string;
  redirectPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    const result = await uploadDocument(formData);
    return result ?? { error: "" };
  }, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        + Attach document
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <input type="hidden" name="redirect_path" value={redirectPath} />

      <input
        type="file"
        name="file"
        required
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
        className="text-xs"
      />
      <p className="text-[11px] text-slate-400">PDF, Word, or image — max 10MB.</p>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
