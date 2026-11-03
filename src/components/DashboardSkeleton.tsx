// Instant placeholder shown while a dashboard's data loads (used by each
// dashboard's loading.tsx). It mirrors the real layout — header, stat cards,
// list — so the page doesn't jump when the real content arrives.
function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export default function DashboardSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  const content = (
    <div aria-busy="true" aria-label="Loading">
      <Bar className="mb-2 h-3 w-40" />
      <Bar className="mb-6 h-7 w-64" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4">
            <Bar className="mb-2 h-6 w-10" />
            <Bar className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-4 last:border-b-0">
            <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1">
              <Bar className="mb-2 h-3.5 w-48 max-w-full" />
              <Bar className="h-3 w-32" />
            </div>
            <Bar className="hidden h-6 w-24 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!withHeader) return content;

  return (
    <div className="min-h-screen">
      <div className="h-[69px] border-b border-[var(--border-soft)] bg-white/85" />
      <main className="mx-auto max-w-4xl px-6 py-8">{content}</main>
    </div>
  );
}
