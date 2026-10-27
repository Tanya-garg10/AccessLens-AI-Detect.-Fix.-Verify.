import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";

const footerLinks = [
  { label: "WCAG 2.2 Guidelines", href: "https://www.w3.org/WAI/standards-guidelines/wcag/" },
  { label: "axe-core Rules", href: "https://dequeuniversity.com/rules/axe/" },
  { label: "ARIA Authoring Practices", href: "https://www.w3.org/WAI/ARIA/apg/" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-indigo-600">
                <ShieldCheck className="text-white" style={{ width: 15, height: 15 }} aria-hidden="true" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">AccessLens AI</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Automated WCAG 2.2 detection paired with AI-proposed code remediations and deterministic axe-core verification.
            </p>
            <p className="text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} AccessLens AI. All rights reserved.
            </p>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Resources</p>
            <ul className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Caveat */}
          <div className="max-w-xs rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Automated ≠ Complete
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-400/80">
              Automated tools detect roughly 30–40% of WCAG violations. Items flagged{" "}
              <span className="font-semibold">&#8220;Needs manual review&#8221;</span> require human
              judgement and screen-reader testing.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
