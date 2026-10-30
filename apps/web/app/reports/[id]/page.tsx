"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Download,
  Printer,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Code,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AuditReportPage() {
  const params = useParams<{ id: string }>();
  const auditId = params.id;
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["scan", auditId],
    queryFn: () => api.getScan(auditId),
    enabled: Boolean(auditId),
  });

  const handleDownload = async (format: "json" | "html" | "md") => {
    try {
      setDownloadingFormat(format);
      const content = await api.exportScan(auditId, format);
      const mime =
        format === "json"
          ? "application/json"
          : format === "html"
          ? "text/html"
          : "text/markdown";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accesslens-report-${auditId}.${format === "md" ? "md" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export report: " + (err instanceof Error ? err.message : "Network error"));
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-muted-foreground">Preparing official accessibility report...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 text-xl font-bold text-foreground">Report Not Available</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "The requested audit report could not be found."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </main>
    );
  }

  const { scan, issues, fixes } = data;
  const critical = issues.filter((i) => i.impact === "critical");
  const serious = issues.filter((i) => i.impact === "serious");
  const moderate = issues.filter((i) => i.impact === "moderate");
  const minor = issues.filter((i) => i.impact === "minor");
  const fixed = issues.filter((i) => i.status === "fixed");
  const manual = issues.filter((i) => i.status === "manual");

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Top action bar (hidden during print) */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/audit/${auditId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interactive Audit
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
          <button
            type="button"
            onClick={() => handleDownload("html")}
            disabled={Boolean(downloadingFormat)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            HTML
          </button>
          <button
            type="button"
            onClick={() => handleDownload("json")}
            disabled={Boolean(downloadingFormat)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>
          <button
            type="button"
            onClick={() => handleDownload("md")}
            disabled={Boolean(downloadingFormat)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            Markdown
          </button>
        </div>
      </div>

      {/* Official Report Card */}
      <article className="rounded-3xl border border-border bg-card p-8 shadow-lg shadow-slate-900/5 sm:p-12 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <header className="border-b border-border pb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                <ShieldCheck className="h-6 w-6" />
                <span>AccessLens AI</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Accessibility Conformance Audit Report
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Evaluated against WCAG 2.2 Level A/AA standards using axe-core deterministic engine with NVIDIA Nemotron AI remediation analysis.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-center dark:bg-indigo-950/40 dark:border-indigo-900/60 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Score
              </span>
              <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300">
                {Math.round(scan.score)}
              </span>
              <span className="text-[10px] text-muted-foreground">out of 100</span>
            </div>
          </div>

          {/* Audit Metadata Table */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-muted/30 p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Audit ID:</span>
              <p className="font-mono font-medium text-foreground truncate mt-0.5">{scan.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Generated:</span>
              <p className="font-medium text-foreground mt-0.5">
                {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Target Type:</span>
              <p className="font-medium text-foreground uppercase mt-0.5">{scan.inputType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Target Source:</span>
              <p className="font-medium text-foreground truncate mt-0.5">
                {scan.url || "Pasted HTML Document"}
              </p>
            </div>
          </div>
        </header>

        {/* Executive Summary Section */}
        <section className="mt-8">
          <h2 className="text-base font-bold text-foreground">1. Executive Summary</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            The automated audit detected <strong>{issues.length}</strong> total accessibility barriers across the target document. A breakdown of severity levels and remediation outcomes is outlined below.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-center dark:border-red-950 dark:bg-red-950/20">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">Critical</span>
              <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">{critical.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-center dark:border-amber-950 dark:bg-amber-950/20">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Serious</span>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{serious.length}</p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-3.5 text-center dark:border-yellow-950 dark:bg-yellow-950/20">
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Moderate</span>
              <p className="mt-1 text-2xl font-bold text-yellow-700 dark:text-yellow-400">{moderate.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Verified Fixed</span>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{fixed.length}</p>
            </div>
          </div>
        </section>

        {/* Detailed Findings Table */}
        <section className="mt-10">
          <h2 className="text-base font-bold text-foreground">2. Detected Accessibility Barriers</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Rule ID</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">WCAG Criteria</th>
                  <th className="py-2.5 px-3">Selector</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{issue.ruleId}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        issue.impact === "critical"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"
                          : issue.impact === "serious"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {issue.impact}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{issue.wcag.join(", ") || "Best Practice"}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] max-w-xs truncate text-muted-foreground">
                      {issue.selector}
                    </td>
                    <td className="py-2.5 px-3 font-semibold capitalize text-foreground">{issue.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Remediation Proposals Section */}
        {fixes.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-foreground">3. AI-Generated Remediation Proposals</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Synthesized by NVIDIA Nemotron via Nebius Token Factory. Each proposal underwent deterministic verification against axe-core rules before status update.
            </p>

            <div className="mt-4 space-y-4">
              {fixes.map((fix) => (
                <div key={fix.id} className="rounded-2xl border border-border bg-muted/20 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-foreground">{fix.selector}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      fix.verified
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400"
                    }`}>
                      {fix.verified ? "Verified Fixed" : "Proposal Ready"}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{fix.explanation}</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="rounded-lg bg-red-950/10 border border-red-200 dark:border-red-900/50 p-2.5 text-red-900 dark:text-red-300 overflow-x-auto">
                      <span className="block text-[10px] font-bold text-red-700 dark:text-red-400 mb-1">ORIGINAL HTML:</span>
                      <code>{fix.originalHtml}</code>
                    </div>
                    <div className="rounded-lg bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 p-2.5 text-emerald-900 dark:text-emerald-300 overflow-x-auto">
                      <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">PROPOSED PATCH:</span>
                      <code>{fix.fixedHtml}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scope, Limitations and Responsible AI Disclaimer */}
        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Scope, Limitations & Responsible AI Notice</span>
          </div>
          <p>
            <strong>Automated Testing Limitations:</strong> Automated testing tools like axe-core can reliably detect roughly 30% to 57% of WCAG success criteria (such as missing image alt attributes, contrast ratios, and structural label associations). Manual testing by human accessibility specialists and testing with native screen readers (such as NVDA, JAWS, and VoiceOver) is necessary for comprehensive WCAG 2.2 compliance certification.
          </p>
          <p>
            <strong>AI Remediation Guardrails:</strong> Proposed fixes are generated using open-source NVIDIA Nemotron models hosted on Nebius Token Factory. The AI is never permitted to self-certify its fixes; every modified DOM node is independently audited by deterministic axe-core checks before being marked verified.
          </p>
        </section>

        {/* Report Footer */}
        <footer className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>Generated by AccessLens AI · Detect. Fix. Verify.</span>
          <span>Nebius × NVIDIA Global AI Hackathon</span>
        </footer>
      </article>
    </main>
  );
}
