import { createClient } from "@/lib/supabase/server";
import AddSchoolForm from "@/components/AddSchoolForm";

export default async function SchoolsPage() {
  const supabase = await createClient();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, district, is_remote")
    .order("name");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Schools</h1>
          <p className="mt-1 text-sm text-slate-500">
            A school added here shows up immediately in the registration page&rsquo;s school dropdown.
          </p>
        </div>
        <AddSchoolForm />
      </div>

      {!schools || schools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-slate-500">
          No schools yet — add the first one above.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s, i) => (
            <div
              key={s.id}
              style={{ "--stagger-index": i } as React.CSSProperties}
              className="hover-lift animate-in rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px]">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
                    />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{s.district ?? "District not set"}</p>
                  {s.is_remote && (
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Upland / remote
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
