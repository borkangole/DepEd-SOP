import LogoutButton from "./LogoutButton";
import NotificationBell from "./NotificationBell";

type Role = "teacher" | "school_admin" | "division" | "super_admin";

// One accent color per role so it's immediately obvious, even at a glance,
// which dashboard you're looking at — matters a lot once you're jumping
// between test accounts to check the pipeline end to end.
const ROLE_META: Record<Role, { label: string; badge: string; accent: string }> = {
  teacher: { label: "Teacher", badge: "bg-blue-100 text-blue-800", accent: "border-blue-500" },
  school_admin: {
    label: "School Admin",
    badge: "bg-purple-100 text-purple-800",
    accent: "border-purple-500",
  },
  division: {
    label: "Division Office",
    badge: "bg-emerald-100 text-emerald-800",
    accent: "border-emerald-500",
  },
  super_admin: { label: "Super Admin", badge: "bg-rose-100 text-rose-800", accent: "border-rose-500" },
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
    <header className={`border-b-4 ${meta?.accent ?? "border-slate-200"} bg-white px-6 py-4`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {meta && (
            <span
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.badge}`}
            >
              {meta.label}
            </span>
          )}
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>
          )}
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
