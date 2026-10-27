import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AccessLens AI — Detect. Fix. Verify.",
    template: "%s · AccessLens AI",
  },
  description:
    "AI-powered WCAG 2.2 accessibility agent with deterministic axe-core verification. Automated detection, contextual code remediation, and verified re-audit.",
  keywords: ["accessibility", "WCAG", "axe-core", "a11y", "AI remediation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
