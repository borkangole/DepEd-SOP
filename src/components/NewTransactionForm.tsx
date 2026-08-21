"use client";

import { useActionState, useState } from "react";
import { submitTransaction } from "@/app/actions/transactions";

const initialState: { error: string } = { error: "" };

type SopEntry = {
  id: string;
  transaction_type: "authority_to_travel" | "leave_application";
  title: string;
  purpose: string;
  requirements: string[];
  steps: string[];
  processing_time_days: number;
};

export default function NewTransactionForm({ sopEntries }: { sopEntries: SopEntry[] }) {
  const [selectedId, setSelectedId] = useState(sopEntries[0]?.id ?? "");
  const selected = sopEntries.find((s) => s.id === selectedId);

  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    const result = await submitTransaction(formData);
    return result ?? { error: "" };
  }, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="sop_catalog_id" className="block text-sm font-medium text-slate-700">
          Transaction type
        </label>
        <select
          id="sop_catalog_id"
          name="sop_catalog_id"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {sopEntries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <input type="hidden" name="transaction_type" value={selected?.transaction_type ?? ""} />
      </div>

      {selected && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{selected.purpose}</p>
          <p className="mt-2 font-medium text-slate-900">Requirements:</p>
          <ul className="ml-4 list-disc">
            {selected.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Typical processing time: {selected.processing_time_days} working day(s)
          </p>
        </div>
      )}

      {selected?.transaction_type === "leave_application" && (
        <div>
          <label htmlFor="leave_kind" className="block text-sm font-medium text-slate-700">
            Leave type
          </label>
          <select
            id="leave_kind"
            name="leave_kind"
            required
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="maternity">Maternity Leave</option>
            <option value="leave_credits">Leave Credits</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {selected?.transaction_type === "authority_to_travel" && (
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
          Purpose / Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <p className="text-xs text-slate-500">
        Document upload is not wired up in this pilot slice yet — attach physical/scanned copies when the
        School Administrative Officer verifies your submission.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit Transaction"}
      </button>
    </form>
  );
}
