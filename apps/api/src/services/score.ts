import type { Issue } from "@accesslens/shared";

type ScoredIssue = Pick<Issue, "impact">;
const penalties = { critical: 10, serious: 5, moderate: 2, minor: 1 } as const;

export function calculateScore(issues: readonly ScoredIssue[]): number {
  const penalty = issues.reduce((total, issue) => total + penalties[issue.impact], 0);
  return Math.max(0, 100 - penalty);
}
