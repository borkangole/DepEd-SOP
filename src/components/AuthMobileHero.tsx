import Image from "next/image";
import LoginScene from "@/components/LoginScene";

// Phone / tablet version of the auth hero: a rounded banner with the logo,
// page title and a zoomed-in crop of the animated scene. The form card
// below overlaps its bottom edge. Hidden from lg up, where AuthHero shows.
export default function AuthMobileHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="login-hero relative overflow-hidden rounded-b-[2rem] border-b border-[var(--border-soft)] px-5 pt-8 pb-14 lg:hidden">
      <div className="animate-in relative z-[1] flex flex-col items-center text-center">
        <Image
          src="/deped-logo.webp"
          alt="Department of Education"
          width={1280}
          height={654}
          priority
          className="h-11 w-auto"
        />
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Scene rendered wider than the screen and centered, so the cards are
          big enough to read; the ribbon's tail and the plane crop off the
          edges. Negative margins trim the empty sky above and below. */}
      <div className="pointer-events-none relative left-1/2 -mt-[10%] -mb-[14%] w-[135%] max-w-[600px] -translate-x-1/2">
        <LoginScene idPrefix="mobile" />
      </div>
    </div>
  );
}
