type IconKey = "total" | "pending" | "processing" | "approved" | "rejected" | "schools" | "users";

const ICONS: Record<IconKey, React.ReactNode> = {
  total: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H8.5a2 2 0 00-1.4.6L4.6 7.1A2 2 0 004 8.5V18a2 2 0 002 2z"
    />
  ),
  pending: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />,
  processing: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  ),
  approved: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9m6 3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  rejected: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-1.5a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  ),
  schools: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
    />
  ),
  users: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-4-4"
    />
  ),
};

type Stat = {
  label: string;
  value: number;
  accent?: string; // Tailwind text color class for the number, e.g. "text-red-600"
  icon?: IconKey;
};

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="hover-lift animate-in min-w-[140px] flex-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4"
          style={{ "--stagger-index": i } as React.CSSProperties}
        >
          <div className="flex items-center gap-3">
            {s.icon && (
              <span className={`shrink-0 rounded-lg bg-slate-50 p-2 ${s.accent ?? "text-slate-500"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  {ICONS[s.icon]}
                </svg>
              </span>
            )}
            <div>
              <p className={`font-display text-2xl leading-none font-semibold ${s.accent ?? "text-slate-900"}`}>
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium tracking-wide text-slate-500 uppercase">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
