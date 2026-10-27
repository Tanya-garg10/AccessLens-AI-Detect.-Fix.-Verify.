import type { AxeResults, NodeResult, Result } from "axe-core";
import type { Issue } from "@accesslens/shared";

const impactRank = { critical: 0, serious: 1, moderate: 2, minor: 3 } as const;

function impactOf(impact: Result["impact"]): Issue["impact"] {
  return impact === "critical" || impact === "serious" || impact === "moderate" || impact === "minor" ? impact : "minor";
}

function wcagCriteria(tags: string[]): string[] {
  return [...new Set(tags.flatMap((tag) => {
    const match = /^wcag(\d)(\d)(\d)$/i.exec(tag);
    return match ? [`${match[1]}.${match[2]}.${match[3]}`] : [];
  }))];
}

function issueFromNode(scanId: string, violation: Result, node: NodeResult): Issue {
  const selector = node.target.join(", ");
  return {
    id: "",
    scanId,
    ruleId: violation.id,
    impact: impactOf(node.impact ?? violation.impact),
    wcag: wcagCriteria(violation.tags),
    selector,
    html: node.html,
    message: node.failureSummary ?? violation.help,
    source: "axe",
    status: "open",
  };
}

export function normalizeAxeViolations(scanId: string, results: Pick<AxeResults, "violations">): Issue[] {
  const issues: Issue[] = [];
  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      issues.push(issueFromNode(scanId, violation, node));
    }
  }
  return normalizeIssues(issues);
}

export function normalizeIssues(issues: readonly Issue[]): Issue[] {
  const unique = new Map<string, Issue>();
  for (const issue of issues) unique.set(`${issue.ruleId}\u0000${issue.selector}`, issue);
  return [...unique.values()].sort((a, b) => impactRank[a.impact] - impactRank[b.impact]);
}
