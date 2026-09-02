"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createSopEntry, updateSopEntry } from "@/app/actions/sopCatalog";
import type { TransactionType, LeaveKind, TransferScope } from "@/lib/types/database";

const initialState: { error: string } = { error: "" };

export type SopEntryData = {
  id: string;
  transaction_type: TransactionType;
  leave_kind: LeaveKind | null;
  transfer_scope: TransferScope | null;
  title: string;
  purpose: string;
  requirements: string[];
  steps: string[];
  responsible_offices: string;
  processing_time_days: number;
};

const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  authority_to_travel: "Authority to Travel",
  leave_application: "Leave Application",
  transfer_of_assignment: "Transfer of Assignment",
};

const LEAVE_KIND_LABEL: Record<LeaveKind, string> = {
  maternity: "Maternity Leave",
  leave_credits: "Leave Credits",
};

const TRANSFER_SCOPE_LABEL: Record<TransferScope, string> = {
  teaching_school_to_school: "Teaching Personnel, School to School",
  non_teaching_or_senior_hs: "Non-Teaching Personnel",
  other_division_agency: "Transfer to Other Division/Agency",
};

/**
 * Add / edit form for one sop_catalog row. In "add" mode (no `entry`), the
 * Super Admin picks transaction_type (+ leave_kind / transfer_scope, when
 * applicable) — this is what makes the entry show up as its own option in
 * the teacher's "New Transaction" dropdown (NewTransactionForm reads
 * straight from sop_catalog). In "edit" mode those three fields are shown
 * read-only: changing which teacher-facing slot an existing entry fills,
 * once transactions may already reference it, would be confusing — treat
 * that as deactivating the old entry and adding a new one instead.
 */
export default function SopEntryForm({
  entry,
  onDone,
}: {
  /** Omit to render the "add new entry" form; pass an existing row to edit it. */
  entry?: SopEntryData;
  /** Called after a successful save, so the parent can collapse this form. */
  onDone?: () => void;
}) {
  const isEdit = !!entry;
  const [transactionType, setTransactionType] = useState<TransactionType>(
    entry?.transaction_type ?? "authority_to_travel"
  );
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmittedRef = useRef(false);

  const action = isEdit ? updateSopEntry : createSopEntry;
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    hasSubmittedRef.current = true;
    const result = await action(formData);
    return result ?? { error: "" };
  }, initialState);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state.error) {
      hasSubmittedRef.current = false;
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="animate-in space-y-3 rounded-xl border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--brand)_3%,white)] p-4"
    >
      {isEdit && <input type="hidden" name="id" value={entry.id} />}

      {isEdit ? (
        <div className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">{TRANSACTION_TYPE_LABEL[entry.transaction_type]}</span>
          {entry.leave_kind && <span> · {LEAVE_KIND_LABEL[entry.leave_kind]}</span>}
          {entry.transfer_scope && <span> · {TRANSFER_SCOPE_LABEL[entry.transfer_scope]}</span>}
          <span className="ml-1">(fixed — deactivate and add a new entry to change this)</span>
        </div>
      ) : (
        <>
          <label className="block text-xs font-medium text-slate-600">
            Transaction type
            <select
              name="transaction_type"
              required
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
            >
              {Object.entries(TRANSACTION_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {transactionType === "leave_application" && (
            <label className="block text-xs font-medium text-slate-600">
              Leave type
              <select
                name="leave_kind"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
                {Object.entries(LEAVE_KIND_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {transactionType === "transfer_of_assignment" && (
            <label className="block text-xs font-medium text-slate-600">
              Transfer scope
              <select
                name="transfer_scope"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
              >
                <option value="" disabled>
                  Select…
                </option>
                {Object.entries(TRANSFER_SCOPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

      <label className="block text-xs font-medium text-slate-600">
        Title
        <input
          type="text"
          name="title"
          required
          defaultValue={entry?.title}
          placeholder="e.g. Application for Leave — Maternity Leave"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        Purpose
        <textarea
          name="purpose"
          required
          rows={2}
          defaultValue={entry?.purpose}
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        Requirements (one per line — leave blank if none required)
        <textarea
          name="requirements"
          rows={5}
          defaultValue={entry?.requirements.join("\n")}
          placeholder={"(3 original copies) Endorsement duly signed by the School Head/Principal\n(1 original) Accomplished CS Form No. 6"}
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 font-mono text-xs focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <label className="block text-xs font-medium text-slate-600">
        Steps (one per line, optional)
        <textarea
          name="steps"
          rows={3}
          defaultValue={entry?.steps.join("\n")}
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 font-mono text-xs focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-slate-600">
          Responsible office(s)
          <input
            type="text"
            name="responsible_offices"
            defaultValue={entry?.responsible_offices}
            placeholder="e.g. School Head, SDO - Records"
            className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Processing time (working days)
          <input
            type="number"
            name="processing_time_days"
            min={0}
            required
            defaultValue={entry?.processing_time_days ?? 0}
            className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand)] focus:outline-none"
          />
        </label>
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="hover-lift rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
        </button>
        <button
          type="button"
          onClick={() => onDone?.()}
          className="rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
