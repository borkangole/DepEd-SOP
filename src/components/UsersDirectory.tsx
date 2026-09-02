"use client";

import { useMemo, useState } from "react";
import type { UserRole } from "@/lib/types/database";

type UserRow = {
  id: string;
  full_name: string;
  employee_id: string | null;
  role: UserRole;
  schoolName: string | null;
};

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

const ROLE_FILTERS: { key: UserRole | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "teacher", label: "Teachers" },
  { key: "school_admin", label: "School Admins" },
  { key: "division", label: "Division" },
  { key: "super_admin", label: "Super Admins" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Read-only account directory. RLS (profiles_select_division_admin) lets
 * Super Admin and Division read every profile, but there's no manage
 * policy yet — no update/deactivate here, just search and browse. Adding
 * role/school edits would need its own migration + form, so this is left
 * as a clean starting point rather than half-built controls that 400 on
 * submit.
 */
export default function UsersDirectory({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");

  const counts = useMemo(() => {
    const c: Record<UserRole | "all", number> = {
      all: users.length,
      teacher: 0,
      school_admin: 0,
      division: 0,
      super_admin: 0,
    };
    for (const u of users) c[u.role]++;
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) ||
        (u.employee_id ?? "").toLowerCase().includes(q) ||
        (u.schoolName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, role]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee ID, or school…"
            className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setRole(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              role === f.key
                ? "bg-[var(--brand)] text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-[var(--border-soft)] hover:bg-slate-50"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${role === f.key ? "text-white/70" : "text-slate-400"}`}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No accounts match this search.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {filtered.map((u, i) => (
              <li
                key={u.id}
                style={{ "--stagger-index": i } as React.CSSProperties}
                className="animate-in flex items-center gap-3 px-4 py-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-xs font-semibold text-[var(--brand)]">
                  {initials(u.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{u.full_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {u.schoolName ?? "No school on file"}
                    {u.employee_id && ` · ID ${u.employee_id}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
