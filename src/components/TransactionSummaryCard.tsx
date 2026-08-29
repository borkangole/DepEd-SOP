import { STATUS_LABEL, STATUS_COLOR, getTransactionLabel } from "@/lib/status";
import type { TransactionDetail } from "@/lib/transactionDetail";

const DETAIL_FIELD_LABEL: Record<string, string> = {
  reason: "Reason",
  start_date: "Start date",
  end_date: "End date",
  destination: "Destination",
};

/** Shared "what is this request" card used across all four detail pages. */
export default function TransactionSummaryCard({
  transaction,
  showRequester,
}: {
  transaction: TransactionDetail;
  /** School Admin / Division / Super Admin detail pages show who filed it; the teacher's own doesn't need to. */
  showRequester?: boolean;
}) {
  const detailEntries = Object.entries(transaction.details).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{getTransactionLabel(transaction)}</h2>
          {showRequester && (
            <p className="mt-1 text-sm text-slate-500">
              {transaction.teacher_name} · {transaction.school_name}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Submitted {new Date(transaction.submitted_at).toLocaleString()}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[transaction.current_status]}`}
        >
          {STATUS_LABEL[transaction.current_status]}
        </span>
      </div>

      {transaction.scheduled_date && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-900">
            📅 Scheduled: {new Date(transaction.scheduled_date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {transaction.schedule_note && (
            <p className="mt-1 text-xs text-emerald-800">{transaction.schedule_note}</p>
          )}
        </div>
      )}

      {detailEntries.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          {detailEntries.map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium text-slate-400">{DETAIL_FIELD_LABEL[key] ?? key}</dt>
              <dd className="text-sm text-slate-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {transaction.sop && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-400">Requirements checklist</p>
          {transaction.sop.requirements.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No supporting documents required for this request type.</p>
          ) : (
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-sm text-slate-700">
              {transaction.sop.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}