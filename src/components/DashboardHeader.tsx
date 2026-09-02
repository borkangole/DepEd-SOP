import LogoutButton from "./LogoutButton";
import NotificationBell from "./NotificationBell";

type Role = "teacher" | "school_admin" | "division" | "super_admin";

// One accent color per role so it's immediately obvious, even at a glance,
// which dashboard you're looking at — matters a lot once you're jumping
// between test accounts to check the pipeline end to end.
const ROLE_META: Record<Role, { label: string; badge: string; accent: string; dot: string }> = {
  teacher: { label: "Teacher", badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200", accent: "#2563eb", dot: "bg-blue-500" },
  school_admin: {
    label: "School Admin",
    badge: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
    accent: "#9333ea",
    dot: "bg-purple-500",
  },
  division: {
    label: "Division Office",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    accent: "#059669",
    dot: "bg-emerald-500",
  },
  super_admin: {
    label: "Super Admin",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    accent: "#e11d48",
    dot: "bg-rose-500",
  },
};

export default function DashboardHeader({
  title,
  subtitle,
  role,
  userName,
}: {
  title: string;
  subtitle?: string;
  role?: Role;
  userName?: string | null;
}) {
  const meta = role ? ROLE_META[role] : null;

  return (
    <header
      className="sticky top-0 z-10 border-b border-[var(--border-soft)] bg-white/85 px-6 py-4 backdrop-blur-sm"
      style={{ boxShadow: meta ? `inset 0 -3px 0 0 ${meta.accent}` : undefined }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {meta && (
            <span
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${meta.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          )}
          <div>
            <h1 className="font-display text-lg leading-tight font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>}
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
