"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from "lucide-react";
import type { Fix, Issue } from "@accesslens/shared";
import { api } from "@/lib/api";

interface IssueSheetProps {
  issue: Issue | null;
  fix?: Fix | null | undefined;
  scanId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IssueSheet({ issue, fix, scanId, isOpen, onClose }: IssueSheetProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Reset state when issue changes
  useEffect(() => {
    setExplanation(null);
    setExplainError(null);
    setIsExplaining(false);
  }, [issue?.id]);

  // Handle ESC key to close sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus the close button when opened
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  const handleExplain = async () => {
    try {
      setIsExplaining(true);
      setExplainError(null);
      const text = await api.explainIssue(scanId, issue.id);
      setExplanation(text);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : "Failed to generate explanation");
    } finally {
      setIsExplaining(false);
    }
  };

  const getImpactBadge = (impact: Issue["impact"]) => {
    switch (impact) {
      case "critical":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
      case "serious":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
      case "moderate":
        return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-300";
      default:
        return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-sheet-title"
        aria-describedby="issue-sheet-desc"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-border bg-card p-6 shadow-2xl transition-transform dark:bg-slate-900 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getImpactBadge(issue.impact)}`}>
                {issue.impact}
              </span>
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {issue.source === "axe" ? "axe-core" : "keyboard audit"}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                issue.status === "fixed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : issue.status === "manual"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                  : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              }`}>
                {issue.status}
              </span>
            </div>
            <h2 id="issue-sheet-title" className="text-xl font-bold tracking-tight text-foreground">
              {issue.ruleId}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close issue details panel"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-6 overflow-y-auto py-6 pr-1">
          {/* Issue explanation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Violation Details
            </h3>
            <p id="issue-sheet-desc" className="mt-1 text-sm text-foreground">
              {issue.message}
            </p>
          </div>

          {/* WCAG & Selector metadata */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">WCAG Success Criteria</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {issue.wcag.length > 0 ? (
                  issue.wcag.map((w) => (
                    <span key={w} className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                      WCAG {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Best Practice</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">DOM Selector</span>
              <p className="mt-1 truncate font-mono text-xs font-medium text-foreground" title={issue.selector}>
                {issue.selector}
              </p>
            </div>
          </div>

          {/* Offending HTML snippet */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Offending HTML Element
            </h3>
            <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-slate-950 p-3.5 text-xs font-mono text-slate-100 dark:bg-slate-950">
              <code>{issue.html}</code>
            </div>
          </div>

          {/* AI Explanation Feature: "Why does this matter?" */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-5 dark:border-indigo-950 dark:from-indigo-950/20 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground">
                  User Impact Perspective
                </h3>
              </div>
              {!explanation && (
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={isExplaining}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {isExplaining ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span>Consulting AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Why does this matter?</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {explanation && (
              <div className="mt-3 rounded-lg border border-indigo-200/60 bg-white/80 p-3.5 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900/80 dark:text-slate-300">
                <p className="font-medium text-indigo-950 dark:text-indigo-200">
                  Assistive Technology Experience:
                </p>
                <p className="mt-1">{explanation}</p>
              </div>
            )}

            {explainError && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {explainError}
              </p>
            )}
          </div>

          {/* AI Remediation Fix (if generated) */}
          {fix && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  Proposed Code Remediation
                </h3>
                {fix.needsHumanReview && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Needs manual review
                  </span>
                )}
              </div>

              {/* Confidence Meter */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Remediation Confidence</span>
                  <span className="font-bold text-foreground">{Math.round(fix.confidence * 100)}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${
                      fix.confidence >= 0.8
                        ? "bg-emerald-500"
                        : fix.confidence >= 0.6
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.round(fix.confidence * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(fix.confidence * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Fix confidence: ${Math.round(fix.confidence * 100)} percent`}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{fix.explanation}</p>

              <div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">Remediated HTML</span>
                <div className="mt-1 overflow-x-auto rounded-lg border border-border bg-slate-950 p-3 text-xs font-mono text-emerald-400 dark:bg-slate-950">
                  <code>{fix.fixedHtml}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
