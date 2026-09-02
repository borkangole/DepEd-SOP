// Plain GET form — no client JS needed. Submitting reloads the same
// dashboard route with ?q=... appended, and the page's server component
// reads it back via `searchParams` to filter the list. Works with the
// browser back/forward buttons and bookmarking for free.
export default function TransactionSearchBar({
  action,
  defaultValue,
}: {
  action: string;
  defaultValue?: string;
}) {
  return (
    <form action={action} method="GET" className="mb-4 flex gap-2">
      <div className="relative w-full">
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
          name="q"
          defaultValue={defaultValue}
          placeholder="Search by teacher name or transaction type…"
          className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="hover-lift shrink-0 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
      >
        Search
      </button>
      {defaultValue && (
        <a
          href={action}
          className="shrink-0 rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </a>
      )}
    </form>
  );
}