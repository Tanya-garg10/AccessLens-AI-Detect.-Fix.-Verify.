"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  CheckCircle2,
  Lock,
  Zap,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
  Eye,
  SlidersHorizontal,
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
      router.push(`/audit/${res.scan.id}`);
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
      router.push(`/audit/${res.scan.id}`);
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
        demoHtml = `<!DOCTYPE html><html lang="en"><head><title>Demo Aura Brew</title></head><body><h1>Aura Brew</h1><h4>Fresh Beans</h4><div onclick="alert(1)">Buy Now</div><img src="coffee.jpg"><input placeholder="Name"><select id="opt"><option>Beans</option></select><button tabindex="5">VIP</button></body></html>`;
      }
      const res = await api.createScan({ html: demoHtml });
      toastSuccess("Demo audit launched!");
      router.push(`/audit/${res.scan.id}`);
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
        className="hero-mesh relative px-4 pb-20 pt-16 sm:px-6 lg:px-8"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />
            Nebius Token Factory × NVIDIA Nemotron
          </div>

          <h1
            id="hero-heading"
            className="animate-fade-up-delay-1 mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Detect.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Fix.
            </span>{" "}
            Verify.
          </h1>
          <p className="mt-2 text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 sm:text-2xl">
            Build for Everyone.
          </p>

          <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A developer-focused accessibility platform combining deterministic <strong>axe-core</strong> scanning with <strong>NVIDIA Nemotron</strong> AI remediation. Inspect violations, review proposed code patches, and verify fixes with re-audited proof.
          </p>

          {/* CTA cluster */}
          <div className="animate-fade-up-delay-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/audit/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start Free Audit
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={handleTryDemo}
              disabled={isDemoLoading || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {isDemoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              )}
              Explore Live Demo
            </button>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              { icon: ShieldCheck, label: "Deterministic axe-core Verification" },
              { icon: Lock, label: "SSRF Protected & Sandboxed" },
              { icon: Zap, label: "NVIDIA Nemotron via Nebius" },
              { icon: CheckCircle2, label: "WCAG 2.2 Level A/AA" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 font-medium">
                <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Scan input card ── */}
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
                  { id: "url", label: "Scan Public URL", Icon: Globe },
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
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "url" ? (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="scan-url-input" className="block text-xs font-semibold text-foreground">
                    Enter publicly accessible URL
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="scan-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (urlError) setUrlError(null);
                      }}
                      placeholder="https://yourwebsite.com"
                      aria-invalid={Boolean(urlError)}
                      aria-describedby={urlError ? "url-error-msg" : "url-hint-msg"}
                      className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 transition focus-visible:ring-2 ${
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
                      Audited with headless Chromium & axe-core. Private network addresses are blocked.
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
                      Auditing URL…
                    </>
                  ) : (
                    <>
                      Run Accessibility Audit
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleHtmlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="scan-html-input" className="block text-xs font-semibold text-foreground">
                    Paste HTML source markup
                  </label>
                  <div className="relative mt-2">
                    <textarea
                      id="scan-html-input"
                      rows={6}
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
                      Audited in an isolated DOM sandbox. Max 500 KB.
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
                      Auditing HTML…
                    </>
                  ) : (
                    <>
                      Audit HTML Markup
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Interactive Sample Audit Preview ── */}
      <section className="mx-auto mt-24 max-w-5xl px-4 sm:px-6 lg:px-8" aria-labelledby="preview-heading">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Sample Audit Preview
              </div>
              <h2 id="preview-heading" className="mt-2 text-xl font-bold text-foreground">
                Live Evidence-Based Remediation
              </h2>
              <p className="text-xs text-muted-foreground">
                See how AccessLens AI detects real barriers and generates verifiable fixes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTryDemo}
              disabled={isDemoLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Launch This Demo Audit
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-4 dark:border-red-950 dark:bg-red-950/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                Detected Barrier [Critical]
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-foreground">image-alt: Image missing alternative text</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Screen readers announce bare file name "coffee.jpg", leaving blind users without visual context.
              </p>
              <div className="mt-3 rounded-lg bg-background p-2.5 font-mono text-[11px] border border-border">
                <code className="text-red-600 dark:text-red-400">&lt;img src="coffee.jpg"&gt;</code>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                NVIDIA Nemotron Verified Fix
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-foreground">WCAG 1.1.1 Non-Text Content (Level A)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Patch synthesized and confirmed compliant by axe-core re-audit in fresh DOM sandbox.
              </p>
              <div className="mt-3 rounded-lg bg-background p-2.5 font-mono text-[11px] border border-border">
                <code className="text-emerald-600 dark:text-emerald-400">&lt;img src="coffee.jpg" alt="Artisan roasted espresso beans"&gt;</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works: Detect -> Fix -> Verify ── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="how-it-works-heading">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            The Engine Loop
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How AccessLens AI Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A three-step verification loop ensuring AI remediation cannot self-certify.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Search,
              title: "1. Detect",
              description:
                "Headless Chromium executes axe-core across 90+ WCAG 2.2 rules while Playwright simulates keyboard Tab/Shift-Tab focus navigation to find traps.",
              color: "indigo",
            },
            {
              step: "02",
              icon: Wrench,
              title: "2. Fix",
              description:
                "NVIDIA Nemotron via Nebius Token Factory analyzes element outerHTML, computed styles, and accessibility tree to synthesize minimal semantic patches.",
              color: "violet",
            },
            {
              step: "03",
              icon: FileCheck2,
              title: "3. Verify",
              description:
                "Patches are applied in a safe sandbox and re-audited deterministically by axe-core. Only verified passing elements are marked resolved.",
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
                <span className="font-mono text-3xl font-black text-border">{step}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Technology Stack & Responsible AI Section ── */}
      <section className="mx-auto mt-24 max-w-5xl px-4 sm:px-6 lg:px-8" aria-labelledby="tech-heading">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-indigo-50/20 p-8 shadow-sm dark:to-indigo-950/10 sm:p-10">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Technology & AI Disclosure
            </span>
          </div>
          <h2 id="tech-heading" className="mt-2 text-2xl font-bold text-foreground">
            Nebius Token Factory + NVIDIA Nemotron
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This platform is built for the Nebius × NVIDIA Global AI Hackathon. It leverages Nebius AI Cloud's OpenAI-compatible API to call open-source NVIDIA Nemotron models (<code>nvidia/llama-3.1-nemotron-70b-instruct</code>) to analyze structured accessibility failures.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-border bg-background p-4">
              <span className="font-bold text-foreground">Deterministic Grounding</span>
              <p className="mt-1 text-muted-foreground">No hallucinations. axe-core rules dictate failure status; AI provides explanations and minimal candidate patches.</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <span className="font-bold text-foreground">Safe Remediation</span>
              <p className="mt-1 text-muted-foreground">Patches are inspected before application. Third-party sites are never modified; only isolated sandboxes are patched.</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <span className="font-bold text-foreground">Responsible Claim</span>
              <p className="mt-1 text-muted-foreground">We never claim a site is fully compliant based on automated tests alone. Manual review items are always highlighted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to action banner ── */}
      <section className="mx-auto my-24 max-w-4xl px-4 text-center sm:px-6">
        <div className="rounded-3xl bg-indigo-600 px-6 py-12 text-white shadow-xl shadow-indigo-500/20 sm:p-14">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to Make the Web Accessible to Everyone?</h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-indigo-100">
            Run your first real scan in seconds. No login required.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/audit/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              Start Free Audit Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-indigo-700/50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
