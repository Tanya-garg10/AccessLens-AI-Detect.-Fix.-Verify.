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
        <nav aria-label="Primary navigation" className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/dashboard"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
              pathname === "/dashboard" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/audit/new"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
              pathname === "/audit/new" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            New Audit
          </Link>
          <Link
            href="/settings"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${
              pathname === "/settings" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            Settings
          </Link>
          <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          <Link
            href="/audit/new"
            className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-flex"
          >
            Start Free Audit
          </Link>
          <div className="ml-1 h-4 w-px bg-border" aria-hidden="true" />
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
