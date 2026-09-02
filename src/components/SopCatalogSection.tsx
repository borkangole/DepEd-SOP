"use client";

import { useState, useTransition } from "react";
import { toggleSopEntryActive } from "@/app/actions/sopCatalog";
import SopEntryForm, { type SopEntryData } from "@/components/SopEntryForm";

type Entry = SopEntryData & { is_active: boolean };

/**
 * The Super Admin dashboard's SOP Catalog section: a live list plus
 * add/edit/deactivate, replacing what used to be a read-only dump of the
 * table with instructions to edit rows in Supabase directly.
 */
export default function SopCatalogSection({ entries }: { entries: Entry[] }) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(entry: Entry) {
    const formData = new FormData();
    formData.set("id", entry.id);
    formData.set("next_active", String(!entry.is_active));
    startTransition(() => {
      toggleSopEntryActive(formData);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{entries.length} {entries.length === 1 ? "entry" : "entries"} on file</p>
        {editingId !== "new" && (
          <button
            onClick={() => setEditingId("new")}
            className="hover-lift inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-xs font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add SOP Entry
          </button>
        )}
      </div>

      {editingId === "new" && <SopEntryForm onDone={() => setEditingId(null)} />}

      {entries.length === 0 && editingId !== "new" && (
        <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-slate-500">
          No SOP entries yet — add one to let teachers start filing this transaction type.
        </div>
      )}

      {entries.map((s, i) =>
        editingId === s.id ? (
          <SopEntryForm key={s.id} entry={s} onDone={() => setEditingId(null)} />
        ) : (
          <div
            key={s.id}
            style={{ "--stagger-index": i } as React.CSSProperties}
            className={`animate-in rounded-xl border bg-[var(--surface)] p-5 ${
              s.is_active ? "border-[var(--border-soft)]" : "border-[var(--border-soft)] opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-sm font-semibold text-slate-900">{s.title}</h3>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => setEditingId(s.id)}
                  className="rounded-md border border-[var(--border-soft)] px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(s)}
                  className="rounded-md border border-[var(--border-soft)] px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-sm text-slate-600">{s.purpose}</p>
            <p className="mt-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Requirements</p>
            {s.requirements.length === 0 ? (
              <p className="text-sm text-slate-500">No supporting documents required.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {s.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-sm text-slate-700">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Processing time: <span className="font-medium text-slate-700">{s.processing_time_days} working day(s)</span>
            </p>
            {!s.is_active && (
              <p className="mt-2 text-xs text-amber-700">
                Inactive — hidden from the teacher&rsquo;s &ldquo;New Transaction&rdquo; dropdown. Existing
                transactions filed against it are unaffected.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
