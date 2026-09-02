import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

// Fraunces: a warm, characterful serif for headings and names — gives the
// system a human, institutional-but-not-cold feel rather than defaulting to
// a generic sans everywhere.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

// Public Sans: designed for government digital services (USWDS) — a fitting,
// highly legible workhorse for body text, forms, and data-dense tables.
const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital SOP System — Division of Capiz",
  description: "Standard Operating Procedures: Manual to Digital Transformation of School Administrative Processes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${fraunces.variable} ${publicSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
