/**
 * Shown on the teacher's transaction detail page when the transaction's
 * current status is "for_correction", so the reason a School Admin sent it
 * back doesn't require scrolling down into the status-history timeline to
 * find. The note is already recorded there (via updateTransactionStatus) —
 * this just surfaces the most recent one prominently.
 */
export default function CorrectionBanner({ note }: { note: string | null }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-900">⚠ Action needed: this request was returned for correction</p>
      <p className="mt-1 text-sm text-red-800">
        {note
          ? note
          : "The School Administrative Officer flagged this submission as incomplete or incorrect. Check the status history below for details, then attach corrected documents."}
      </p>
    </div>
  );
}
