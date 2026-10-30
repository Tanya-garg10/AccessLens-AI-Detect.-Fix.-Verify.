"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  ArrowRight,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ListAuditsResponse } from "@accesslens/shared";

export default function DashboardPage() {
  const [data, setData] = useState<ListAuditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.listAudits();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAudits();
  }, []);

  const totalAudits = data?.totalAudits ?? 0;
  const totalIssues = data?.totalIssues ?? 0;
  const totalVerified = data?.totalVerified ?? 0;
  const avgScore = data?.averageScore ?? 100;
  const severityCounts = data?.severityCounts ?? { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const maxSeverity = Math.max(
    severityCounts.critical,
    severityCounts.serious,
    severityCounts.moderate,
    severityCounts.minor,
    1
  );

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Audit Intelligence Hub
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Accessibility Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time compliance monitoring, verified remediations, and audit history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAudits}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
          <Link
            href="/audit/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Start New Audit
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading audit records from database…</p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold text-foreground">Could not load dashboard data</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={fetchAudits}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      ) : totalAudits === 0 ? (
        /* Empty state */
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Layers className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">No audit history found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            You haven't run any accessibility audits yet. Start an audit with a public URL, uploaded HTML, or test the one-click demo page.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/audit/new"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create First Audit
            </Link>
            <Link
              href="/audit/new?demo=true"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Try Sample Demo
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Key Metrics Grid */}
          <section aria-label="Key accessibility statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audited Pages
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-foreground">{totalAudits}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total pages scanned</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detected Barriers
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-foreground">{totalIssues}</p>
              <p className="mt-1 text-xs text-muted-foreground">WCAG violations discovered</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verified Fixes
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalVerified}</p>
              <p className="mt-1 text-xs text-muted-foreground">Deterministic axe-verified</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Average Score
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-foreground">{avgScore} <span className="text-sm font-normal text-muted-foreground">/ 100</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Across all historical scans</p>
            </div>
          </section>

          {/* Severity Distribution & AI Status */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Visual Severity Distribution Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Violation Severity Distribution</h2>
                  <p className="text-xs text-muted-foreground">Real breakdown of detected barriers across stored scans</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{totalIssues} total issues</span>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { label: "Critical", count: severityCounts.critical, color: "bg-red-500", text: "text-red-700 dark:text-red-400", bgLight: "bg-red-50 dark:bg-red-950/40" },
                  { label: "Serious", count: severityCounts.serious, color: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-950/40" },
                  { label: "Moderate", count: severityCounts.moderate, color: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400", bgLight: "bg-yellow-50 dark:bg-yellow-950/40" },
                  { label: "Minor", count: severityCounts.minor, color: "bg-slate-500", text: "text-slate-700 dark:text-slate-300", bgLight: "bg-slate-50 dark:bg-slate-900/40" },
                ].map(({ label, count, color, text, bgLight }) => {
                  const percentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
                  const barWidth = `${Math.max(percentage, count > 0 ? 4 : 0)}%`;
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                          <span className="font-semibold text-foreground">{label}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {count} issues ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${color} transition-all duration-500`}
                          style={{ width: barWidth }}
                          role="progressbar"
                          aria-valuenow={count}
                          aria-valuemin={0}
                          aria-valuemax={totalIssues}
                          aria-label={`${label} issues: ${count}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Architecture & Engine Info */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  Nebius × NVIDIA AI
                </div>
                <h2 className="mt-3 text-base font-bold text-foreground">Remediation Engine</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Powered by NVIDIA Nemotron accessed through Nebius Token Factory for contextual code patch synthesis.
                </p>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono font-medium text-foreground">Nemotron-70B / 340B</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5">
                    <span className="text-muted-foreground">Verification</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">axe-core 4.10.2</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 p-2.5">
                    <span className="text-muted-foreground">Safety Guarantee</span>
                    <span className="font-medium text-foreground">Deterministic Re-Audit</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <Link
                  href="/settings"
                  className="flex items-center justify-between text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                >
                  <span>View Engine Settings & Status</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Recent Audits Table */}
          <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden" aria-labelledby="recent-audits-heading">
            <div className="border-b border-border p-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="recent-audits-heading" className="text-lg font-bold text-foreground">
                  Recent Audit Records
                </h2>
                <p className="text-xs text-muted-foreground">
                  Inspect results, generate AI remediations, and export certified reports.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Showing {data?.audits.length ?? 0} saved audits
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-3.5 pl-6 pr-3">Target</th>
                    <th scope="col" className="px-3 py-3.5">Score</th>
                    <th scope="col" className="px-3 py-3.5">Detected Barriers</th>
                    <th scope="col" className="px-3 py-3.5">Verified Fixes</th>
                    <th scope="col" className="px-3 py-3.5">Date</th>
                    <th scope="col" className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {data?.audits.map((audit) => {
                    const scoreColor =
                      audit.score >= 80
                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : audit.score >= 50
                        ? "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800";

                    return (
                      <tr key={audit.id} className="transition hover:bg-muted/30">
                        <td className="py-4 pl-6 pr-3 font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                              {audit.url || "HTML Document Upload"}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              ID: {audit.id.slice(0, 12)}…
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${scoreColor}`}>
                            {Math.round(audit.score)} / 100
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="text-foreground">{audit.issuesCount} total</span>
                            {audit.criticalCount > 0 && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                                {audit.criticalCount} crit
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {audit.fixedCount} verified
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/audit/${audit.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Inspect
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                            <Link
                              href={`/reports/${audit.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-foreground hover:bg-muted"
                              title="View & Export Report"
                            >
                              Report
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
