"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";
import type { NotificationEntry } from "@/lib/notifications";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBellClient({
  notifications,
  unreadCount,
  detailBasePath,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
  detailBasePath: string;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleItemClick(n: NotificationEntry) {
    if (!n.is_read) {
      startTransition(() => {
        markNotificationRead(n.id);
      });
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
            clipRule="evenodd"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-blue-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => {
                  const content = (
                    <div
                      className={`px-4 py-3 text-sm hover:bg-slate-50 ${!n.is_read ? "bg-blue-50/60" : ""}`}
                    >
                      <p className={`text-slate-800 ${!n.is_read ? "font-medium" : ""}`}>{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.transaction_id ? (
                        <Link href={`${detailBasePath}/${n.transaction_id}`} onClick={() => handleItemClick(n)}>
                          {content}
                        </Link>
                      ) : (
                        <button className="block w-full text-left" onClick={() => handleItemClick(n)}>
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
