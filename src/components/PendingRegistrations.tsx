"use client";

import { useState, useTransition } from "react";
import { reviewRegistration } from "@/app/actions/registrations";
import type { RegistrationEntry } from "@/lib/registrations";
import type { UserRole } from "@/lib/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  teacher: "Teacher",
  school_admin: "School Admin",
  division: "Division Office",
  super_admin: "Super Admin",
};

const ROLE_BADGE: Record<UserRole, string> = {
  teacher: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  school_admin: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  division: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  super_admin: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function registeredAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * Approve / reject list for new accounts. Used on the School Admin and
 * Division dashboards and on Super Admin's Approvals page. `mode="rejected"`
 * lists previously rejected accounts with only an "Approve instead" action,
 * so a mistaken rejection can be undone.
 */
export default function PendingRegistrations({
  accounts,
  title,
  description,
  mode = "pending",
  emptyText,
}: {
  accounts: RegistrationEntry[];
  title: string;
  description?: string;
  mode?: "pending" | "rejected";
  /** Shown when the list is empty; omit to render nothing at all instead. */
  emptyText?: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const visible = accounts.filter((a) => !handled.has(a.id));
  if (visible.length === 0 && !emptyText) return null;

  function decide(id: string, decision: "approved" | "rejected") {
    setError("");
    setBusyId(id);
    startTransition(async () => {
      const result = await reviewRegistration(id, decision);
      if (result.error) {
        setError(result.error);
      } else {
        setHandled((prev) => new Set(prev).add(id));
      }
      setBusyId(null);
      setConfirmRejectId(null);
    });
  }

  return (
    <section
      className={`mb-6 overflow-hidden rounded-xl border bg-[var(--surface)] ${
        mode === "pending" && visible.length > 0 ? "border-amber-200" : "border-[var(--border-soft)]"
      }`}
    >
      <div
        className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${
          mode === "pending" && visible.length > 0
            ? "border-amber-200 bg-amber-50/60"
            : "border-[var(--border-soft)]"
        }`}
      >
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        {visible.length > 0 && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              mode === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {visible.length}
          </span>
        )}
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

      {visible.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-[var(--border-soft)]">
          {visible.map((a) => {
            const busy = busyId === a.id;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-xs font-semibold text-[var(--brand)]">
                  {initials(a.full_name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                    {a.full_name}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[a.role]}`}>
                      {ROLE_LABEL[a.role]}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {a.schoolName ?? "No school selected"}
                    {" · "}
                    {a.employee_id ? `Employee ID ${a.employee_id}` : "No employee ID"}
                    {" · "}
                    registered {registeredAgo(a.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {mode === "pending" && confirmRejectId === a.id ? (
                    <>
                      <span className="text-xs text-slate-500">Reject this account?</span>
                      <button
                        onClick={() => decide(a.id, "rejected")}
                        disabled={busy}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {busy ? "Rejecting…" : "Yes, reject"}
                      </button>
                      <button
                        onClick={() => setConfirmRejectId(null)}
                        disabled={busy}
                        className="rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {mode === "pending" && (
                        <button
                          onClick={() => setConfirmRejectId(a.id)}
                          disabled={busy}
                          className="rounded-md border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => decide(a.id, "approved")}
                        disabled={busy}
                        className="hover-lift rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busy ? "Approving…" : mode === "pending" ? "Approve" : "Approve instead"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
