import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Digital SOP System</h1>
        <p className="mt-1 text-sm text-slate-500">Division of Capiz — sign in to continue</p>

        {params.registered && (
          <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Account created. Check your email for a confirmation link before signing in — you won&rsquo;t be
            able to log in until you&rsquo;ve clicked it.
          </p>
        )}

        <div className="mt-6">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}