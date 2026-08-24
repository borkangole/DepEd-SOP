import type { DocumentWithUrl } from "@/lib/documents";

export default function DocumentList({ documents }: { documents: DocumentWithUrl[] }) {
  if (documents.length === 0) {
    return <p className="mt-2 text-xs text-slate-400">No documents attached yet.</p>;
  }

  return (
    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-slate-600" title={d.file_name}>
            {d.file_name}
          </span>
          {d.url ? (
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-medium text-blue-700 hover:underline"
            >
              View
            </a>
          ) : (
            <span className="shrink-0 text-slate-400">Unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
}
