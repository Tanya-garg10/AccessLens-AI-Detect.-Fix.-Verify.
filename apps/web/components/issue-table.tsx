"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, Filter, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import type { Fix, Issue } from "@accesslens/shared";

interface IssueTableProps {
  issues: Issue[];
  fixes?: Fix[];
  onSelectIssue: (issue: Issue) => void;
}

type SortField = "impact" | "ruleId" | "status";
type SortDirection = "asc" | "desc";

const impactRank = { critical: 4, serious: 3, moderate: 2, minor: 1 };

export function IssueTable({ issues, fixes = [], onSelectIssue }: IssueTableProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("impact");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== "all" && issue.impact !== severityFilter) return false;
      if (categoryFilter !== "all" && issue.source !== categoryFilter) return false;
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      return true;
    });
  }, [issues, severityFilter, categoryFilter, statusFilter]);

  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      let comp = 0;
      if (sortField === "impact") {
        comp = impactRank[a.impact] - impactRank[b.impact];
      } else if (sortField === "ruleId") {
        comp = a.ruleId.localeCompare(b.ruleId);
      } else if (sortField === "status") {
        comp = a.status.localeCompare(b.status);
      }
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredIssues, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
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

  const getStatusChip = (status: Issue["status"]) => {
    switch (status) {
      case "fixed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Fixed
          </span>
        );
      case "manual":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Needs Review
          </span>
        );
      case "unverified":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <HelpCircle className="h-3 w-3" aria-hidden="true" />
            Unverified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Filter Issues:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div>
            <label htmlFor="filter-severity" className="sr-only">Filter by Severity</label>
            <select
              id="filter-severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="serious">Serious</option>
              <option value="moderate">Moderate</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          {/* Category/Source Filter */}
          <div>
            <label htmlFor="filter-category" className="sr-only">Filter by Audit Source</label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">All Audit Engines</option>
              <option value="axe">axe-core</option>
              <option value="custom">Keyboard / Custom</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="sr-only">Filter by Status</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="fixed">Fixed</option>
              <option value="manual">Needs Review</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accessible Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Detected accessibility issues table">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => toggleSort("impact")}
                    className="flex items-center gap-1.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Sort by severity, currently ${sortField === "impact" ? sortDirection : "none"}`}
                  >
                    <span>Severity</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => toggleSort("ruleId")}
                    className="flex items-center gap-1.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Sort by rule ID, currently ${sortField === "ruleId" ? sortDirection : "none"}`}
                  >
                    <span>Rule</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-4">WCAG</th>
                <th scope="col" className="px-6 py-4">Target Selector</th>
                <th scope="col" className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="flex items-center gap-1.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Sort by status, currently ${sortField === "status" ? sortDirection : "none"}`}
                  >
                    <span>Status</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No accessibility issues match the active filters.
                  </td>
                </tr>
              ) : (
                sortedIssues.map((issue) => {
                  const hasFix = fixes.some((f) => f.issueId === issue.id);

                  return (
                    <tr
                      key={issue.id}
                      onClick={() => onSelectIssue(issue)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectIssue(issue);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Inspect issue: ${issue.ruleId}, severity ${issue.impact}, status ${issue.status}`}
                      className="group cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getImpactBadge(issue.impact)}`}>
                          {issue.impact}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {issue.ruleId}
                        </div>
                        <div className="max-w-xs truncate text-xs text-muted-foreground sm:max-w-md">
                          {issue.message}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {issue.wcag.length > 0 ? (
                            issue.wcag.slice(0, 2).map((w) => (
                              <span key={w} className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Best Practice</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <code className="max-w-[200px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                          {issue.selector}
                        </code>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusChip(issue.status)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasFix && (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Fix Ready
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
