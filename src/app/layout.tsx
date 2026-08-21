import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital SOP System — Division of Capiz",
  description: "Standard Operating Procedures: Manual to Digital Transformation of School Administrative Processes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
