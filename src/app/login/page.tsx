import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import AuthHero from "@/components/AuthHero";
import AuthMobileHero from "@/components/AuthMobileHero";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/dashboard";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <AuthHero
        title="Every request, tracked from filing to release."
        description="Travel authority, leave, and transfer requests — submitted online, verified by your school, and processed by the Division, with no trip needed just to check on them."
      />

      {/* Right: sign in */}
      <section className="flex min-h-screen flex-col lg:items-center lg:justify-center lg:px-10 lg:py-10">
        <AuthMobileHero title="Digital SOP System" subtitle="Sign in to continue" />

        <div className="relative z-[1] mx-auto -mt-8 w-full max-w-sm px-5 pb-10 sm:px-0 lg:mt-0 lg:pb-0">
          <div className="animate-in hidden flex-col items-center text-center lg:flex">
            <Image
              src="/deped-logo.webp"
              alt="Department of Education"
              width={1280}
              height={654}
              priority
              className="h-16 w-auto"
            />
            <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">Digital SOP System</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
          </div>

          {params.registered && (
            <p className="animate-in mb-4 rounded-lg border border-green-200 lg:mt-6 lg:mb-0 bg-green-50 px-3.5 py-2.5 text-sm text-green-800">
              Account created. Check your email for a confirmation link first. After that, your account still needs
              to be approved (by your School Admin or the Division Office) before you can use the system.
            </p>
          )}

          <div
            className="animate-in rounded-2xl lg:mt-7 border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_-24px_rgba(28,35,51,0.35)]"
            style={{ "--stagger-index": 1 } as React.CSSProperties}
          >
            <LoginForm redirectTo={redirectTo} />
          </div>

          <p
            className="animate-in mt-6 text-center text-sm text-slate-500"
            style={{ "--stagger-index": 2 } as React.CSSProperties}
          >
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-[var(--deped-blue)] hover:underline">
              Register here
            </Link>
          </p>

          <p className="mt-10 text-center text-xs text-slate-400">
            Department of Education &middot; Schools Division of Capiz
          </p>
        </div>
      </section>
    </main>
  );
}
