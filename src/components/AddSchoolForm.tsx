"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createSchool } from "@/app/actions/schools";

const initialState: { error: string } = { error: "" };

/**
 * Super Admin's "add a school" form. A new school shows up immediately in
 * the /register page's school dropdown — that page reads the schools table
 * fresh on every render, so nothing else needs to change once this saves.
 */
export default function AddSchoolForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmittedRef = useRef(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    hasSubmittedRef.current = true;
    const result = await createSchool(formData);
    return result ?? { error: "" };
  }, initialState);

  // On a successful save (no error, not pending, and we actually submitted
  // — not just mounted), reset and collapse the form back to the button.
  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
      hasSubmittedRef.current = false;
    }
  }, [pending, state.error]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hover-lift inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-semibold text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add School
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="animate-in flex w-full max-w-sm flex-col gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--brand)_3%,white)] p-4"
    >
      <label className="text-xs font-medium text-slate-600">
        School name
        <input
          type="text"
          name="name"
          required
          placeholder="e.g. Capiz East Elementary School"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2.5 py-1.5 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <label className="text-xs font-medium text-slate-600">
        District (optional)
        <input
          type="text"
          name="district"
          placeholder="e.g. Capiz District II"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-white px-2.5 py-1.5 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input type="checkbox" name="is_remote" className="rounded border-[var(--border-soft)]" />
        Upland / remote school
      </label>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="hover-lift rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save school"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
