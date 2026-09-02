"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type NavKey = "dashboard" | "transactions" | "sop" | "schools" | "users";

const NAV: { key: NavKey; href: string; label: string; icon: ReactNode }[] = [
  {
    key: "dashboard",
    href: "/dashboard/admin",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12l8.25-8.25L20.25 12M4.5 9.75V19.5a.75.75 0 00.75.75H9a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h3.75a.75.75 0 00.75-.75V9.75"
      />
    ),
  },
  {
    key: "transactions",
    href: "/dashboard/admin/transactions",
    label: "Transactions",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H8.5a2 2 0 00-1.4.6L4.6 7.1A2 2 0 004 8.5V18a2 2 0 002 2z"
      />
    ),
  },
  {
    key: "sop",
    href: "/dashboard/admin/sop-catalog",
    label: "SOP Catalog",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    ),
  },
  {
    key: "schools",
    href: "/dashboard/admin/schools",
    label: "Schools",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
      />
    ),
  },
  {
    key: "users",
    href: "/dashboard/admin/users",
    label: "Users",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-4-4"
      />
    ),
  },
];

/**
 * Shared app shell for every /dashboard/admin/* route: a persistent sidebar
 * (drawer on mobile) plus a slim top bar. Individual pages own their own
 * heading and content — this only owns navigation chrome, so it lives once
 * in the layout instead of being copy-pasted per page.
 */
export default function AdminShell({
  userName,
  pendingCount,
  notificationBell,
  logoutButton,
  children,
}: {
  userName?: string | null;
  pendingCount: number;
  notificationBell: ReactNode;
  logoutButton: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-[var(--border-soft)] bg-[var(--surface)] transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border-soft)] px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] font-display text-sm font-bold text-white">
            DS
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm leading-tight font-semibold text-slate-900">Digital SOP</p>
            <p className="truncate text-[11px] text-slate-500">Division of Capiz</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.href === "/dashboard/admin" ? pathname === item.href : pathname.startsWith(item.href);
            const showBadge = item.key === "transactions" && pendingCount > 0;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[color-mix(in_srgb,var(--brand)_6%,white)] hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-500"}`}
                  >
                    {item.icon}
                  </svg>
                  {item.label}
                </span>
                {showBadge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      active ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-soft)] p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-rose-700 uppercase ring-1 ring-inset ring-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Super Admin
          </span>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:min-w-0">
        <header
          className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-white/85 px-5 backdrop-blur-sm"
          style={{ boxShadow: "inset 0 -3px 0 0 #e11d48" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {userName && <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>}
            {notificationBell}
            {logoutButton}
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
