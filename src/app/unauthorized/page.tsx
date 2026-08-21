import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
      <p className="max-w-sm text-sm text-slate-600">
        Your account does not have permission to view that page.
      </p>
      <Link href="/dashboard" className="text-sm font-medium text-blue-700 hover:underline">
        Back to your dashboard
      </Link>
    </main>
  );
}
