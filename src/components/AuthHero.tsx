import LoginScene from "@/components/LoginScene";

// Left half of the login / register pages (desktop only): headline plus the
// animated request-flow illustration. Sticky, so on the longer register page
// it stays in view while the form scrolls.
export default function AuthHero({
  eyebrow = "Schools Division of Capiz",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="login-hero relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:px-14 xl:px-20">
      <div className="relative z-[1] mx-auto w-full max-w-2xl">
        <p className="animate-in text-xs font-semibold tracking-[0.18em] text-[var(--deped-blue)] uppercase">
          {eyebrow}
        </p>
        <h2
          className="animate-in mt-3 max-w-lg font-display text-4xl leading-[1.1] font-semibold text-slate-900 xl:text-5xl"
          style={{ "--stagger-index": 1 } as React.CSSProperties}
        >
          {title}
        </h2>
        <p
          className="animate-in mt-4 max-w-md text-base text-slate-600"
          style={{ "--stagger-index": 2 } as React.CSSProperties}
        >
          {description}
        </p>

        <div className="mt-6">
          <LoginScene idPrefix="desktop" />
        </div>
      </div>
    </section>
  );
}
