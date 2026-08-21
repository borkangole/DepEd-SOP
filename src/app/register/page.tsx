import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: schools } = await supabase.from("schools").select("id, name").order("name");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">Digital SOP System — Division of Capiz</p>

        <div className="mt-6">
          <RegisterForm schools={schools ?? []} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
