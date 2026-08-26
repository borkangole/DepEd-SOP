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
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by teacher name or transaction type…"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Search
      </button>
      {defaultValue && (
        <a
          href={action}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </a>
      )}
    </form>
  );
}