"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { STATUS_LABEL } from "@/lib/status";
import type { TransactionStatus } from "@/lib/types/database";

export type SearchItem = {
  id: string;
  kind: "transaction" | "school" | "user";
  label: string;
  sublabel: string;
  href: string;
  status?: TransactionStatus;
};

const KIND_LABEL: Record<SearchItem["kind"], string> = {
  transaction: "Transactions",
  school: "Schools",
  user: "Users",
};

const KIND_ICON: Record<SearchItem["kind"], React.ReactNode> = {
  transaction: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H8.5a2 2 0 00-1.4.6L4.6 7.1A2 2 0 004 8.5V18a2 2 0 002 2z"
    />
  ),
  school: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
    />
  ),
  user: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-4-4"
    />
  ),
};

/**
 * One search box across everything Super Admin manages — transactions,
 * schools, and users — instead of having to guess which section a name
 * lives under before you can even start looking. Filters client-side
 * against data the dashboard already loaded; nothing extra is fetched.
 */
export default function AdminGlobalSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)).slice(0, 8);
  }, [items, query]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<SearchItem["kind"], SearchItem[]>> = {};
    for (const r of results) {
      (groups[r.kind] ??= []).push(r);
    }
    return groups;
  }, [results]);

  const open = focused && query.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setFocused(true);
          }}
          onBlur={() => {
            // Small delay so a click on a result registers before the
            // dropdown unmounts.
            blurTimeout.current = setTimeout(() => setFocused(false), 120);
          }}
          placeholder="Search transactions, schools, or users…"
          className="hover-lift w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] py-3 pr-3 pl-10 text-sm shadow-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            (Object.keys(grouped) as SearchItem["kind"][]).map((kind) => (
              <div key={kind}>
                <p className="border-b border-[var(--border-soft)] bg-slate-50 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {KIND_LABEL[kind]}
                </p>
                <ul>
                  {grouped[kind]!.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[color-mix(in_srgb,var(--brand)_4%,white)]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
                            {KIND_ICON[item.kind]}
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">{item.label}</span>
                          <span className="block truncate text-xs text-slate-500">{item.sublabel}</span>
                        </span>
                        {item.status && (
                          <span className="shrink-0 text-xs font-medium text-slate-500">{STATUS_LABEL[item.status]}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
