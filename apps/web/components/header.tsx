"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Github } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md text-foreground transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="AccessLens AI — Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-indigo-600 shadow-sm shadow-indigo-500/40 transition-transform group-hover:scale-[1.04]">
            <ShieldCheck className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-foreground">AccessLens</span>
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground">AI · Detect. Fix. Verify.</span>
          </div>
        </Link>

        {/* Nav */}
        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {!isHome && (
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              New Scan
            </Link>
          )}
          <a
            href="https://www.w3.org/WAI/standards-guidelines/wcag/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:block"
          >
            WCAG 2.2
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>
          <div className="ml-1 h-4 w-px bg-border" aria-hidden="true" />
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
