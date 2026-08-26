"use client";

import { useActionState, useRef, useState } from "react";
import { submitTransaction } from "@/app/actions/transactions";

const initialState: { error: string } = { error: "" };

type SopEntry = {
  id: string;
  transaction_type: "authority_to_travel" | "leave_application" | "transfer_of_assignment";
  leave_kind: "maternity" | "leave_credits" | null;
  transfer_scope: "teaching_school_to_school" | "non_teaching_or_senior_hs" | "other_division_agency" | null;
  title: string;
  purpose: string;
  requirements: string[];
  steps: string[];
  processing_time_days: number;
};

export default function NewTransactionForm({ sopEntries }: { sopEntries: SopEntry[] }) {
  const [selectedId, setSelectedId] = useState(sopEntries[0]?.id ?? "");
  const selected = sopEntries.find((s) => s.id === selectedId);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function removeFile(index: number) {
    if (!fileInputRef.current) return;
    const next = selectedFiles.filter((_, i) => i !== index);
    const dataTransfer = new DataTransfer();
    next.forEach((f) => dataTransfer.items.add(f));
    fileInputRef.current.files = dataTransfer.files;
    setSelectedFiles(next);
  }

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
        <input type="hidden" name="leave_kind" value={selected?.leave_kind ?? ""} />
        <input type="hidden" name="transfer_scope" value={selected?.transfer_scope ?? ""} />
      </div>

      {selected && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{selected.purpose}</p>
          {selected.requirements.length > 0 ? (
            <>
              <p className="mt-2 font-medium text-slate-900">Requirements:</p>
              <ul className="ml-4 list-disc">
                {selected.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-slate-600">No supporting documents required for this request type.</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Typical processing time: {selected.processing_time_days} working day(s)
          </p>
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

      <div>
        <label className="block text-sm font-medium text-slate-700">Supporting documents (optional)</label>

        <label
          htmlFor="documents"
          className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
        >
          <span className="text-sm text-slate-600">
            <span className="font-semibold text-blue-700">Click to choose files</span>
          </span>
          <span className="mt-1 text-xs text-slate-400">PDF, Word, or image — max 10MB each</span>
        </label>
        <input
          ref={fileInputRef}
          id="documents"
          name="documents"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
          className="sr-only"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
        />

        {selectedFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {selectedFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
              >
                <span className="truncate" title={f.name}>
                  {f.name}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-slate-400">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="font-medium text-red-600 hover:text-red-700"
                    aria-label={`Remove ${f.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-1 text-xs text-slate-500">
          You can also attach documents later from your dashboard, e.g. if the School Administrative Officer
          asks for something additional.
        </p>
      </div>

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