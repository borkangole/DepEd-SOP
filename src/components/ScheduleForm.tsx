"use client";

import { useActionState, useState } from "react";
import { updateTransactionSchedule } from "@/app/actions/transactions";

const initialState: { error: string } = { error: "" };

/**
 * Lets Division (or Super Admin) set/update/clear the "ready/visit" date on
 * a transaction. Shown on the Division and Super Admin transaction detail
 * pages, independent of the status-update form — a schedule isn't itself a
 * status, so it can be set at any point.
 */
export default function ScheduleForm({
  transactionId,
  redirectPath,
  scheduledDate,
  scheduleNote,
}: {
  transactionId: string;
  redirectPath: string;
  scheduledDate: string | null;
  scheduleNote: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    const result = await updateTransactionSchedule(formData);
    return result ?? { error: "" };
  }, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {scheduledDate ? "Update schedule" : "Set visit/pickup date"}
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <input type="hidden" name="redirect_path" value={redirectPath} />

      <label className="text-xs font-medium text-slate-600">
        Date
        <input
          type="date"
          name="scheduled_date"
          defaultValue={scheduledDate ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        />
      </label>

      <textarea
        name="schedule_note"
        defaultValue={scheduleNote ?? ""}
        placeholder="Optional note (e.g. what to bring, office hours)"
        rows={2}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
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
