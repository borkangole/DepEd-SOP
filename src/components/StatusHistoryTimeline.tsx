import { STATUS_LABEL } from "@/lib/status";
import type { StatusHistoryEntry } from "@/lib/statusHistory";

export default function StatusHistoryTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-400">No status history yet.</p>;
  }

  return (
    <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
          <p className="text-sm font-medium text-slate-900">{STATUS_LABEL[h.status]}</p>
          <p className="text-xs text-slate-500">
            {h.actor_name} · {new Date(h.changed_at).toLocaleString()}
          </p>
          {h.note && <p className="mt-1 text-xs italic text-slate-600">&ldquo;{h.note}&rdquo;</p>}
        </li>
      ))}
    </ol>
  );
}