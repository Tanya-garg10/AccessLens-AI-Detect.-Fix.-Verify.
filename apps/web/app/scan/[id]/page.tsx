"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  CheckCheck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileCode,
  FileCheck2,
  ChevronRight,
} from "lucide-react";
import type { Issue } from "@accesslens/shared";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { ScoreRing } from "@/components/score-ring";
import { ProgressStepper } from "@/components/progress-stepper";
import { IssueTable } from "@/components/issue-table";
import { IssueSheet } from "@/components/issue-sheet";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ScanReportPage() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load accessibility report">
      <ScanReportContent />
    </ErrorBoundary>
  );
}

function ScanReportContent() {
  const params = useParams<{ id: string }>();
  const scanId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { error: toastError, success: toastSuccess } = useToast();

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => api.getScan(scanId),
    enabled: Boolean(scanId),
  });

  const generateFixesMutation = useMutation({
    mutationFn: () => api.generateFixes(scanId),
    onSuccess: (res) => {
      toastSuccess(`Generated ${res.fixes.length} AI remediation proposals`);
      void queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : "Failed to generate fixes");
    },
  });

  const applyAllMutation = useMutation({
    mutationFn: async () => {
      if (!data?.fixes || data.fixes.length === 0) {
        throw new Error("No fixes generated yet. Click 'Generate AI fixes' first.");
      }
      const fixIds = data.fixes.map((f) => f.id);
      return api.applyFixes(scanId, fixIds);
    },
    onSuccess: (res) => {
      toastSuccess(`Applied ${res.appliedFixIds.length} fixes successfully`);
      void queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
      router.push(`/scan/${scanId}/fix`);
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : "Failed to apply fixes");
    },
  });

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading scan report">
          <div className="h-6 w-56 rounded-lg bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="h-60 rounded-2xl bg-muted" />
            <div className="h-60 rounded-2xl bg-muted lg:col-span-2" />
          </div>
          <div className="h-80 rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  /* ── Error state ── */
  if (error || !data) {
    return (
      <main id="main-content" className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Scan not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "The requested scan record could not be loaded."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start new scan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const { scan, issues, fixes } = data;
  const criticalCount = issues.filter((i) => i.impact === "critical").length;
  const seriousCount = issues.filter((i) => i.impact === "serious").length;
  const moderateCount = issues.filter((i) => i.impact === "moderate").length;
  const minorCount = issues.filter((i) => i.impact === "minor").length;
  const fixedCount = issues.filter((i) => i.status === "fixed").length;
  const needsReviewCount = fixes.filter((f) => f.needsHumanReview).length;

  const handleRowClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsSheetOpen(true);
  };

  const selectedFix = selectedIssue ? fixes.find((f) => f.issueId === selectedIssue.id) : undefined;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Breadcrumb + header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="font-medium text-foreground">Scan Report</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
              {scan.id}
            </code>
            <span className="text-xs text-muted-foreground">
              {new Date(scan.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <h1
            className="mt-2 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {scan.inputType === "url" && scan.url ? (
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-lg items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="truncate">{scan.url}</span>
                <ExternalLink className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
              </a>
            ) : (
              "Raw HTML Audit"
            )}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            WCAG 2.2 Level A/AA · axe-core + Playwright keyboard simulation
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Refresh scan data"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => generateFixesMutation.mutate()}
            disabled={generateFixesMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {generateFixesMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            )}
            {fixes.length > 0 ? "Regenerate fixes" : "Generate AI fixes"}
          </button>

          {fixes.length > 0 && (
            <button
              type="button"
              onClick={() => applyAllMutation.mutate()}
              disabled={applyAllMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {applyAllMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Apply all fixes
            </button>
          )}

          <Link
            href={`/scan/${scanId}/fix`}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <FileCode className="h-3.5 w-3.5" aria-hidden="true" />
            View diff
          </Link>
        </div>
      </div>

      {/* ── Live progress ── */}
      <section className="mb-6" aria-label="Scan pipeline progress">
        <ProgressStepper scanId={scanId} onComplete={() => refetch()} />
      </section>

      {/* ── Score + breakdown ── */}
      <section
        className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3"
        aria-labelledby="audit-summary-heading"
      >
        {/* Score ring */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6">
          <p
            id="audit-summary-heading"
            className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Compliance score
          </p>
          <ScoreRing
            score={scan.score}
            criticalCount={criticalCount}
            seriousCount={seriousCount}
            moderateCount={moderateCount}
            minorCount={minorCount}
          />
        </div>

        {/* Stats breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Remediation overview</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Issue counts by state. Click any row in the table below to open the AI-proposed fix.
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total issues", value: issues.length, color: "text-foreground" },
              { label: "Fixes proposed", value: fixes.length, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Resolved", value: fixedCount, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Needs review", value: needsReviewCount, color: "text-amber-600 dark:text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-muted/40 px-4 py-3.5">
                <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
                <dd className={`mt-1 text-2xl font-extrabold tracking-tight ${color}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              <span>axe-core engine + Playwright keyboard simulator</span>
            </div>
            <Link
              href={`/scan/${scanId}/fix`}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              Open Monaco diff editor
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Issue table ── */}
      <section aria-labelledby="issues-heading">
        <div className="mb-4">
          <h2 id="issues-heading" className="text-base font-bold text-foreground">
            Detected violations
          </h2>
          <p className="text-xs text-muted-foreground">
            Click any row to inspect details, context node, and the AI-proposed remediation.
          </p>
        </div>
        <IssueTable issues={issues} fixes={fixes} onSelectIssue={handleRowClick} />
      </section>

      {/* ── Issue detail sheet ── */}
      <IssueSheet
        issue={selectedIssue}
        fix={selectedFix}
        scanId={scanId}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </main>
  );
}
