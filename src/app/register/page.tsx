import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthHero from "@/components/AuthHero";
import AuthMobileHero from "@/components/AuthMobileHero";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: schools } = await supabase.from("schools").select("id, name").order("name");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <AuthHero
        title="One account for every request you file."
        description="Register with your DepEd email. Once your School Admin or the Division Office approves you, you can file and track requests online."
      />

      <section className="flex min-h-screen flex-col lg:items-center lg:justify-center lg:px-10 lg:py-10">
        <AuthMobileHero title="Create an account" subtitle="Digital SOP System · Division of Capiz" />

        <div className="relative z-[1] mx-auto -mt-8 w-full max-w-md px-5 pb-10 sm:px-0 lg:mt-0 lg:pb-0">
          <div className="animate-in hidden flex-col items-center text-center lg:flex">
            <Image
              src="/deped-logo.webp"
              alt="Department of Education"
              width={1280}
              height={654}
              priority
              className="h-14 w-auto"
            />
            <h1 className="mt-5 font-display text-2xl font-semibold text-slate-900">Create an account</h1>
            <p className="mt-1 text-sm text-slate-500">Digital SOP System &middot; Division of Capiz</p>
          </div>

          <div
            className="animate-in rounded-2xl lg:mt-7 border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_-24px_rgba(28,35,51,0.35)]"
            style={{ "--stagger-index": 1 } as React.CSSProperties}
          >
            <RegisterForm schools={schools ?? []} />
          </div>

          <p
            className="animate-in mt-6 text-center text-sm text-slate-500"
            style={{ "--stagger-index": 2 } as React.CSSProperties}
          >
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--deped-blue)] hover:underline">
              Sign in
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
