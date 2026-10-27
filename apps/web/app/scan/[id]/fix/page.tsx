"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Download,
  Eye,
  Code2,
  Loader2,
  TrendingUp,
  FileText,
  FileJson,
  Sparkles,
} from "lucide-react";
import type { Fix, Issue } from "@accesslens/shared";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { ErrorBoundary } from "@/components/error-boundary";

// Dynamically import Monaco DiffEditor to ensure client-side rendering
const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center rounded-xl border border-border bg-muted/30 font-mono text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Monaco Diff Editor...
      </div>
    ),
  }
);

export default function FixAndVerifyPage() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Fix & Verify view">
      <FixAndVerifyContent />
    </ErrorBoundary>
  );
}

function FixAndVerifyContent() {
  const params = useParams<{ id: string }>();
  const scanId = params.id;
  const queryClient = useQueryClient();
  const { error: toastError, success: toastSuccess } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedFixIds, setAppliedFixIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"diff" | "preview">("diff");
  const [initialScore, setInitialScore] = useState<number | null>(null);
  const [verifiedScore, setVerifiedScore] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [hasVerified, setHasVerified] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => api.getScan(scanId),
    enabled: Boolean(scanId),
  });

  // Automatically populate initial applied fixes from DB
  useEffect(() => {
    if (data?.fixes) {
      if (initialScore === null) {
        setInitialScore(data.scan.score);
      }
      // If issues are already marked fixed, add their fixIds
      const fixedIssueIds = new Set(data.issues.filter((i) => i.status === "fixed").map((i) => i.id));
      const initialApplied = new Set<string>();
      data.fixes.forEach((f) => {
        if (fixedIssueIds.has(f.issueId)) {
          initialApplied.add(f.id);
        }
      });
      setAppliedFixIds((prev) => (prev.size === 0 ? initialApplied : prev));
    }
  }, [data, initialScore]);

  const fixes = useMemo(() => data?.fixes ?? [], [data?.fixes]);
  const issues = useMemo(() => data?.issues ?? [], [data?.issues]);

  const currentFix: Fix | undefined = fixes[currentIndex];
  const currentIssue: Issue | undefined = currentFix
    ? issues.find((i) => i.id === currentFix.issueId)
    : undefined;

  // Toggle apply/skip for a specific fix
  const handleToggleCurrentFix = () => {
    if (!currentFix) return;
    setAppliedFixIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentFix.id)) {
        next.delete(currentFix.id);
      } else {
        next.add(currentFix.id);
      }
      return next;
    });
  };

  // Apply all fixes
  const handleApplyAll = () => {
    const all = new Set(fixes.map((f) => f.id));
    setAppliedFixIds(all);
    toastSuccess(`Marked all ${fixes.length} fixes to be applied.`);
  };

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Apply selected fixes to HTML
      if (appliedFixIds.size > 0) {
        await api.applyFixes(scanId, Array.from(appliedFixIds));
      }
      // Step 2: Deterministic verification re-audit
      return api.verifyScan(scanId);
    },
    onSuccess: (res) => {
      setVerifiedScore(res.scan.score);
      setHasVerified(true);
      toastSuccess(`Verification complete! Verified score: ${res.scan.score}/100`);
      void queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
      void refetch();
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : "Verification audit failed");
    },
  });

  // Export handler
  const handleExport = async (format: "html" | "json" | "md") => {
    try {
      setIsExporting(format);
      const content = await api.exportScan(scanId, format);
      const mime = format === "json" ? "application/json" : format === "html" ? "text/html" : "text/markdown";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accesslens-report-${scanId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastSuccess(`Downloaded ${format.toUpperCase()} report!`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(null);
    }
  };

  // Compute live patched HTML for the sandboxed iframe preview
  const patchedHtmlPreview = useMemo(() => {
    let html = data?.scan.html ?? "";
    fixes.forEach((f) => {
      if (appliedFixIds.has(f.id) && html.includes(f.originalHtml)) {
        html = html.replace(f.originalHtml, f.fixedHtml);
      }
    });
    return html;
  }, [data?.scan.html, fixes, appliedFixIds]);

  const originalHtmlPreview = data?.scan.html ?? "";

  if (isLoading || !data) {
    return (
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-96 rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  // Grouped issues after verification
  const fixedIssues = issues.filter((i) => i.status === "fixed");
  const stillFailingIssues = issues.filter((i) => i.status === "open");
  const manualReviewFixes = fixes.filter((f) => f.needsHumanReview);

  const isCurrentApplied = currentFix ? appliedFixIds.has(currentFix.id) : false;
  const scoreDelta = (verifiedScore ?? data.scan.score) - (initialScore ?? data.scan.score);

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href={`/scan/${scanId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Scan Dashboard</span>
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Code Remediation & Verification
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Apply all button */}
          <button
            type="button"
            onClick={handleApplyAll}
            disabled={fixes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>Apply All ({fixes.length})</span>
          </button>

          {/* Verify button */}
          <button
            type="button"
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {verifyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Verify Patches</span>
          </button>
        </div>
      </div>

      {/* After Verify: Score Delta & Results Banner */}
      {hasVerified && (
        <section
          className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 shadow-md dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900"
          aria-labelledby="verify-summary-title"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Deterministic Verification Complete</span>
              </div>
              <h2 id="verify-summary-title" className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Compliance Score Increased to {verifiedScore} / 100
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                All patches were re-audited in a fresh Playwright sandbox running axe-core and keyboard focus checkers.
              </p>
            </div>

            {/* Before / After Animated Delta Card */}
            <div className="flex items-center gap-4 rounded-xl border border-emerald-200/60 bg-white/90 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase text-muted-foreground">Before</span>
                <span className="block text-2xl font-extrabold text-slate-500">{initialScore}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="mr-0.5 h-3.5 w-3.5" aria-hidden="true" />
                  +{scoreDelta}
                </span>
                <div className="h-0.5 w-10 bg-emerald-300 dark:bg-emerald-700" />
              </div>

              <div className="text-center">
                <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">After</span>
                <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400">{verifiedScore}</span>
              </div>
            </div>

            {/* Export Menu */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Export:</span>
              <button
                type="button"
                onClick={() => handleExport("html")}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>HTML</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("json")}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FileJson className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("md")}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>Markdown</span>
              </button>
            </div>
          </div>

          {/* Categorized Lists: Fixed / Still failing / Needs manual review */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-emerald-200/60 pt-4 dark:border-emerald-900/60 sm:grid-cols-3">
            {/* Fixed List */}
            <div className="rounded-xl border border-border bg-card/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Fixed ({fixedIssues.length})</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {fixedIssues.slice(0, 5).map((i) => (
                  <li key={i.id} className="truncate">• {i.ruleId}</li>
                ))}
                {fixedIssues.length > 5 && <li>+{fixedIssues.length - 5} more fixed</li>}
              </ul>
            </div>

            {/* Still Failing List */}
            <div className="rounded-xl border border-border bg-card/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                <span>Still Failing ({stillFailingIssues.length})</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {stillFailingIssues.length === 0 ? (
                  <li className="italic">None! All target violations cleared.</li>
                ) : (
                  stillFailingIssues.map((i) => (
                    <li key={i.id} className="truncate">• {i.ruleId}</li>
                  ))
                )}
              </ul>
            </div>

            {/* Needs Manual Review List */}
            <div className="rounded-xl border border-border bg-card/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>Needs Manual Review ({manualReviewFixes.length})</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {manualReviewFixes.slice(0, 4).map((f) => (
                  <li key={f.id} className="truncate">• {f.selector}</li>
                ))}
                {manualReviewFixes.length === 0 && <li className="italic">No manual reviews required.</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Mode View Tabs (Diff Editor vs Visual Sandboxed Iframe) */}
      <div className="mb-4 flex items-center justify-between">
        <div
          role="tablist"
          aria-label="Remediation preview mode"
          className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "diff"}
            onClick={() => setActiveTab("diff")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "diff"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            } focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Monaco Code Diff</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "preview"}
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "preview"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            } focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sandboxed Visual Preview</span>
          </button>
        </div>

        {/* Issue Navigation Controller */}
        {fixes.length > 0 && activeTab === "diff" && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Fix <span className="font-bold text-foreground">{currentIndex + 1}</span> of {fixes.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                aria-label="Previous fix"
                className="rounded-lg border border-border bg-card p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(fixes.length - 1, prev + 1))}
                disabled={currentIndex === fixes.length - 1}
                aria-label="Next fix"
                className="rounded-lg border border-border bg-card p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Panel 1: Monaco Diff Editor */}
      {activeTab === "diff" && (
        <section
          role="tabpanel"
          aria-label="Code Diff Remediation"
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900"
        >
          {currentFix && currentIssue ? (
            <>
              {/* Current Fix Header Banner */}
              <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold uppercase text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {currentIssue.ruleId}
                    </span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {currentIssue.impact}
                    </span>
                    {currentFix.needsHumanReview && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Needs manual review
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Explanation:</span> {currentFix.explanation}
                  </p>
                </div>

                {/* Per-Fix Apply/Skip Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleCurrentFix}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                      isCurrentApplied
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    } focus-visible:ring-2 focus-visible:ring-primary`}
                  >
                    {isCurrentApplied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span>Fix Applied (Click to Skip)</span>
                      </>
                    ) : (
                      <span>Apply this Fix</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Monaco DiffEditor */}
              <div className="overflow-hidden rounded-xl border border-border bg-slate-950 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400">
                  <span>Original Inaccessible HTML (Left)</span>
                  <span>AI Remediated HTML (Right)</span>
                </div>
                <div className="h-[400px] w-full">
                  <MonacoDiffEditor
                    original={currentFix.originalHtml}
                    modified={currentFix.fixedHtml}
                    language="html"
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-foreground">No AI fixes generated yet</p>
              <p className="text-xs text-muted-foreground">Return to the scan dashboard and click &quot;Generate AI fixes&quot;.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab Panel 2: Live Rendered Sandboxed Iframe Preview (Original vs Patched) */}
      {activeTab === "preview" && (
        <section
          role="tabpanel"
          aria-label="Live Visual Comparison"
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900"
        >
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground">
              Live Sandboxed Rendering (Original vs Patched)
            </h2>
            <p className="text-xs text-muted-foreground">
              Rendered inside an isolated sandbox iframe with scripts strictly disabled for maximum security.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Original Preview */}
            <div className="flex flex-col rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-foreground">
                <span>Original Version</span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-950 dark:text-red-300">
                  Before
                </span>
              </div>
              <iframe
                title="Original HTML visual preview"
                sandbox="allow-same-origin"
                srcDoc={originalHtmlPreview}
                className="h-[500px] w-full bg-white"
              />
            </div>

            {/* Patched Preview */}
            <div className="flex flex-col rounded-xl border border-indigo-200 dark:border-indigo-900/60 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <span>Patched Version ({appliedFixIds.size} fixes applied)</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  After
                </span>
              </div>
              <iframe
                title="Patched HTML visual preview"
                sandbox="allow-same-origin"
                srcDoc={patchedHtmlPreview}
                className="h-[500px] w-full bg-white"
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
