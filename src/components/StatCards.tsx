type Stat = {
  label: string;
  value: number;
  accent?: string; // Tailwind text color class for the number, e.g. "text-red-600"
};

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-4">
      {stats.map((s) => (
        <div key={s.label} className="min-w-[130px] flex-1 rounded-lg border border-slate-200 bg-white p-4">
          <p className={`text-2xl font-semibold ${s.accent ?? "text-slate-900"}`}>{s.value}</p>
          <p className="text-sm text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}