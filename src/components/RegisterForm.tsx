"use client";

import { useActionState, useState } from "react";
import { register } from "@/app/actions/auth";

const initialState: { error: string } = { error: "" };

type School = { id: string; name: string };
type Role = "teacher" | "school_admin" | "division";

const INPUT =
  "w-full rounded-lg border border-[var(--border-soft)] bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-[var(--deped-blue)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--deped-blue)_12%,transparent)] focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-slate-700";
const HINT = "mt-1.5 text-xs text-slate-500";

// Who approves each kind of account — mirrors review_registration() in the
// database, shown up front so nobody is surprised by the approval step.
const ROLES: { value: Role; label: string; approver: string; icon: React.ReactNode }[] = [
  {
    value: "teacher",
    label: "Teacher / Personnel",
    approver: "Approved by your School Admin",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.15A50.6 50.6 0 0012 13.49a50.6 50.6 0 007.74-3.34M4.26 10.15L12 6l7.74 4.15M4.26 10.15v5.1M19.74 10.15V15M12 13.49V20m-4-3.2c2.4 1.6 5.6 1.6 8 0"
      />
    ),
  },
  {
    value: "school_admin",
    label: "School Admin",
    approver: "Approved by the Division Office",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9-4.5V15a9 3 0 01-18 0V7.5l9 4.5z"
      />
    ),
  },
  {
    value: "division",
    label: "Division Office",
    approver: "Approved by the system administrator",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.38c0-.62.5-1.12 1.13-1.12h3.75c.62 0 1.12.5 1.12 1.12V21"
      />
    ),
  },
];

export default function RegisterForm({ schools }: { schools: School[] }) {
  const [role, setRole] = useState<Role>("teacher");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error: string }, formData: FormData) => {
    const result = await register(formData);
    return result ?? { error: "" };
  }, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className={LABEL}>I am registering as</legend>
        <div className="grid gap-2">
          {ROLES.map((r) => {
            const selected = role === r.value;
            return (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${
                  selected
                    ? "border-[var(--deped-blue)] bg-[color-mix(in_srgb,var(--deped-blue)_6%,white)] ring-1 ring-[var(--deped-blue)]"
                    : "border-[var(--border-soft)] bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={selected}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    selected ? "bg-[var(--deped-blue)] text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-[18px] w-[18px]">
                    {r.icon}
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                  <span className="block text-xs text-slate-500">{r.approver}</span>
                </span>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-[var(--deped-blue)]" : "border-slate-300"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-[var(--deped-blue)]" />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="full_name" className={LABEL}>
          Full name
        </label>
        <input id="full_name" name="full_name" required autoComplete="name" placeholder="Juan Dela Cruz" className={INPUT} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="employee_id" className={LABEL}>
            Employee ID
          </label>
          <input id="employee_id" name="employee_id" required className={INPUT} />
        </div>

        <div>
          <label htmlFor="school_id" className={LABEL}>
            School
          </label>
          <select id="school_id" name="school_id" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              Select your school…
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-500">
        Your approver uses your employee ID and school to confirm you&rsquo;re DepEd personnel.
      </p>

      <div>
        <label htmlFor="email" className={LABEL}>
          DepEd email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="juan.delacruz@deped.gov.ph"
          pattern="^[^@\s]+@[Dd][Ee][Pp][Ee][Dd]\.[Gg][Oo][Vv]\.[Pp][Hh]$"
          title="Use your official DepEd email ending in @deped.gov.ph"
          className={INPUT}
        />
        <p className={HINT}>Must end in @deped.gov.ph &mdash; we&rsquo;ll send a confirmation link there.</p>
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className={`${INPUT} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-[18px] w-[18px]">
              {showPassword ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.22A10.48 10.48 0 001.93 12C3.23 16.34 7.24 19.5 12 19.5c.99 0 1.95-.14 2.86-.4M6.23 6.23A10.45 10.45 0 0112 4.5c4.76 0 8.77 3.16 10.07 7.5a10.52 10.52 0 01-4.29 5.77M6.23 6.23L3 3m3.23 3.23l3.65 3.65m7.89 7.89L21 21m-3.23-3.23l-3.65-3.65m0 0a3 3 0 10-4.24-4.24m4.24 4.24L9.88 9.88"
                />
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.04 12.32a1.01 1.01 0 010-.64C3.42 7.51 7.36 4.5 12 4.5c4.64 0 8.57 3.01 9.96 7.18.07.21.07.43 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.57-3.01-9.96-7.18z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </>
              )}
            </svg>
          </button>
        </div>
        <p className={HINT}>At least 8 characters.</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="hover-lift w-full rounded-lg bg-[var(--deped-blue)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
