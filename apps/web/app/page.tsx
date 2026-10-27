"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Code2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Wrench,
  FileCheck2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Zap,
} from "lucide-react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";

const urlFormSchema = z.object({
  url: z.string().trim().url("Please enter a valid URL including http:// or https://"),
});

const htmlFormSchema = z.object({
  html: z.string().trim().min(10, "HTML must contain at least 10 characters"),
});

export default function HomePage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<"url" | "html">("url");
  const [urlInput, setUrlInput] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    const result = urlFormSchema.safeParse({ url: urlInput });
    if (!result.success) {
      setUrlError(result.error.errors[0]?.message || "Invalid URL");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.createScan({ url: result.data.url });
      toastSuccess("Scan initialized successfully!");
      router.push(`/scan/${res.scan.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start scan";
      setUrlError(msg);
      toastError(msg);
      setIsSubmitting(false);
    }
  };

  const handleHtmlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHtmlError(null);
    const result = htmlFormSchema.safeParse({ html: htmlInput });
    if (!result.success) {
      setHtmlError(result.error.errors[0]?.message || "Invalid HTML");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.createScan({ html: result.data.html });
      toastSuccess("HTML scan initialized!");
      router.push(`/scan/${res.scan.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start scan";
      setHtmlError(msg);
      toastError(msg);
      setIsSubmitting(false);
    }
  };

  const handleTryDemo = async () => {
    try {
      setIsDemoLoading(true);
      setUrlError(null);
      setHtmlError(null);
      let demoHtml = "";
      try {
        demoHtml = await api.getDemoHtml("broken-site.html");
      } catch {
        demoHtml = `<!DOCTYPE html><html><head><title>Demo Coffee</title></head><body><h1>Aura Brew</h1><h4>Fresh Beans</h4><div onclick="alert(1)">Buy Now</div><img src="coffee.jpg"><input placeholder="Name"><select id="opt"><option>Beans</option></select><button tabindex="5">VIP</button></body></html>`;
      }
      const res = await api.createScan({ html: demoHtml });
      toastSuccess("Demo scan launched!");
      router.push(`/scan/${res.scan.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load demo page";
      toastError(msg);
      setIsDemoLoading(false);
    }
  };

  return (
    <main id="main-content">
      {/* ── Hero ── */}
      <section
        className="hero-mesh relative px-4 pb-20 pt-20 sm:px-6 lg:px-8"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />
            WCAG 2.2 · axe-core · AI Remediation
          </div>

          <h1
            id="hero-heading"
            className="animate-fade-up-delay-1 mt-8 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Detect.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Fix.
            </span>{" "}
            Verify.
          </h1>

          <p className="animate-fade-up-delay-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            An AI accessibility agent that proposes contextual code remediations — verified
            deterministically by axe-core before anything is considered fixed.
          </p>

          {/* CTA cluster */}
          <div className="animate-fade-up-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleTryDemo}
              disabled={isDemoLoading || isSubmitting}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {isDemoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              )}
              Try broken demo page
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <span className="text-xs text-muted-foreground">or scan your own below ↓</span>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              { icon: Lock, label: "No data stored beyond session" },
              { icon: Zap, label: "Results in under 30 seconds" },
              { icon: CheckCircle, label: "WCAG 2.2 Level A/AA" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scan input card ── */}
      <section
        className="mx-auto -mt-6 max-w-2xl px-4 sm:px-6"
        aria-label="Scan configuration"
      >
        <div className="rounded-2xl border border-border bg-card shadow-xl shadow-slate-900/5 dark:shadow-slate-900/40">
          {/* Tab switcher */}
          <div className="border-b border-border px-6 pt-5">
            <div
              role="tablist"
              aria-label="Scan input method"
              className="inline-flex rounded-lg bg-muted p-1"
            >
              {(
                [
                  { id: "url", label: "Scan URL", Icon: Globe },
                  { id: "html", label: "Paste HTML", Icon: Code2 },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={activeTab === id}
                  aria-controls={`panel-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    activeTab === id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  } focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* URL Panel */}
            {activeTab === "url" && (
              <form
                id="panel-url"
                role="tabpanel"
                aria-labelledby="tab-url"
                onSubmit={handleUrlSubmit}
                noValidate
                className="space-y-4"
              >
                <div>
                  <label htmlFor="scan-url-input" className="block text-sm font-medium text-foreground">
                    Website URL
                    <span className="ml-1 text-muted-foreground font-normal">(public pages only)</span>
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <input
                      id="scan-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (urlError) setUrlError(null);
                      }}
                      placeholder="https://example.com"
                      aria-invalid={Boolean(urlError)}
                      aria-describedby={urlError ? "url-error-msg" : "url-hint-msg"}
                      className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 transition focus-visible:ring-2 ${
                        urlError
                          ? "border-destructive focus-visible:ring-destructive/50"
                          : "border-input focus-visible:ring-ring"
                      }`}
                    />
                  </div>
                  {urlError ? (
                    <p
                      id="url-error-msg"
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {urlError}
                    </p>
                  ) : (
                    <p id="url-hint-msg" className="mt-2 text-xs text-muted-foreground">
                      Rendered via headless Chromium. SSRF-protected — private networks are blocked.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Starting scan…
                    </>
                  ) : (
                    <>
                      Audit Website
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* HTML Panel */}
            {activeTab === "html" && (
              <form
                id="panel-html"
                role="tabpanel"
                aria-labelledby="tab-html"
                onSubmit={handleHtmlSubmit}
                noValidate
                className="space-y-4"
              >
                <div>
                  <label htmlFor="scan-html-input" className="block text-sm font-medium text-foreground">
                    HTML Document or Component
                  </label>
                  <div className="relative mt-2">
                    <textarea
                      id="scan-html-input"
                      rows={7}
                      value={htmlInput}
                      onChange={(e) => {
                        setHtmlInput(e.target.value);
                        if (htmlError) setHtmlError(null);
                      }}
                      placeholder={`<!DOCTYPE html>\n<html lang="en">\n  <head><title>My Page</title></head>\n  <body>...</body>\n</html>`}
                      aria-invalid={Boolean(htmlError)}
                      aria-describedby={htmlError ? "html-error-msg" : "html-hint-msg"}
                      className={`w-full rounded-xl border bg-background p-3.5 font-mono text-[12.5px] leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground/50 transition focus-visible:ring-2 ${
                        htmlError
                          ? "border-destructive focus-visible:ring-destructive/50"
                          : "border-input focus-visible:ring-ring"
                      }`}
                    />
                  </div>
                  {htmlError ? (
                    <p
                      id="html-error-msg"
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {htmlError}
                    </p>
                  ) : (
                    <p id="html-hint-msg" className="mt-2 text-xs text-muted-foreground">
                      Audited locally — no external requests. Max 500 KB.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      Audit HTML
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto mt-28 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" aria-labelledby="how-it-works-heading">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            The methodology
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How AccessLens works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            A deliberate three-phase loop that separates AI proposal generation from
            deterministic compliance verification.
          </p>
        </div>

        <ol className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Search,
              title: "Detect",
              description:
                "Headless Chromium renders the page and axe-core runs 90+ WCAG 2.2 rules. Playwright simultaneously simulates Tab/Shift-Tab keyboard navigation to expose focus traps and unreachable elements.",
              color: "indigo",
            },
            {
              step: "02",
              icon: Wrench,
              title: "Fix",
              description:
                "The AI model receives the original HTML snippet and violation details, then proposes a minimal, semantically-correct patch. Color contrast ratios are resolved mathematically — not guessed.",
              color: "violet",
            },
            {
              step: "03",
              icon: FileCheck2,
              title: "Verify",
              description:
                "The patched HTML is re-audited in a fresh sandbox. The AI cannot self-certify a fix — axe-core has the final word. Only violations that pass re-audit are marked resolved.",
              color: "emerald",
            },
          ].map(({ step, icon: Icon, title, description, color }) => (
            <li
              key={step}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    color === "indigo"
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                      : color === "violet"
                      ? "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                      : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-4xl font-black text-border">{step}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
