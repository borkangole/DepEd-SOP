"use client";

import { useActionState, useState } from "react";
import { updateTransactionStatus } from "@/app/actions/transactions";
import { STATUS_LABEL } from "@/lib/status";
import type { TransactionStatus } from "@/lib/types/database";

const initialState: { error: string } = { error: "" };

export default function StatusUpdateForm({
  transactionId,
  options,
  redirectPath,
}: {
  transactionId: string;
  options: TransactionStatus[];
  redirectPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    const result = await updateTransactionStatus(formData);
    return result ?? { error: "" };
  }, initialState);

  if (options.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Update status
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <input type="hidden" name="redirect_path" value={redirectPath} />

      <select name="status" required className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
        {options.map((o) => (
          <option key={o} value={o}>
            {STATUS_LABEL[o]}
          </option>
        ))}
      </select>

      <textarea
        name="note"
        placeholder="Optional note (e.g. what's missing, remarks)"
        rows={2}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Confirm"}
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
