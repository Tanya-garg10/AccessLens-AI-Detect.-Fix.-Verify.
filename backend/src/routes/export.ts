import type { FastifyPluginAsync } from "fastify";
import { exportFormatSchema, exportScanQuerySchema, exportScanResponseSchema, getScanParamsSchema } from "@accesslens/shared";
import { prisma } from "../lib/prisma.js";
import { parseOrReply, toIssue, toScan } from "./helpers.js";

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/scans/:id/export", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const query = parseOrReply(exportScanQuerySchema, request.query, reply);
    if (!query) return;

    const record = await prisma.scan.findUnique({
      where: { id: params.id },
      include: { issues: { include: { fixes: true } } },
    });
    if (!record) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });

    const scan = toScan(record);
    const issues = record.issues.map(toIssue);
    const fixes = record.issues.flatMap((i) => i.fixes);

    let content = "";

    if (query.format === "json") {
      content = JSON.stringify(
        {
          scan,
          summary: {
            score: scan.score,
            totalIssues: issues.length,
            critical: issues.filter((i) => i.impact === "critical").length,
            serious: issues.filter((i) => i.impact === "serious").length,
            moderate: issues.filter((i) => i.impact === "moderate").length,
            minor: issues.filter((i) => i.impact === "minor").length,
            fixed: issues.filter((i) => i.status === "fixed").length,
            manualReview: fixes.filter((f) => f.needsHumanReview).length,
          },
          issues,
          fixes,
          disclaimer: "Automated checks cover only part of WCAG. Items marked 'Needs manual review' require human testing.",
        },
        null,
        2
      );
    } else if (query.format === "md") {
      content = `# AccessLens AI — Accessibility Audit Report

**Scan ID:** \`${scan.id}\`  
**Generated:** ${new Date().toISOString()}  
**Target:** ${scan.url ?? "Pasted HTML Document"}  
**Overall Accessibility Score:** **${scan.score} / 100**

---

## Executive Summary

| Metric | Count |
|---|---|
| **Total Issues Found** | ${issues.length} |
| **Critical Severity** | ${issues.filter((i) => i.impact === "critical").length} |
| **Serious Severity** | ${issues.filter((i) => i.impact === "serious").length} |
| **Moderate Severity** | ${issues.filter((i) => i.impact === "moderate").length} |
| **Minor Severity** | ${issues.filter((i) => i.impact === "minor").length} |
| **Resolved / Fixed** | ${issues.filter((i) => i.status === "fixed").length} |
| **Needs Manual Review** | ${fixes.filter((f) => f.needsHumanReview).length} |

---

## Detailed Findings

${issues.length === 0 ? "_No accessibility violations detected._" : ""}
${issues
  .map(
    (issue, idx) => `
### ${idx + 1}. [${issue.impact.toUpperCase()}] ${issue.ruleId}

- **Status:** \`${issue.status}\`
- **WCAG Criteria:** ${issue.wcag.map((w) => `\`${w}\``).join(", ") || "Best Practice"}
- **Target Selector:** \`${issue.selector}\`
- **Violation Message:** ${issue.message}

\`\`\`html
${issue.html.slice(0, 500)}
\`\`\`
`
  )
  .join("\n")}

---

> **Notice:** Automated checks cover only part of WCAG. Items marked 'Needs manual review' require human testing.
`;
    } else {
      // HTML format
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AccessLens Report — Scan ${scan.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #1e293b; }
    .header-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; background: ${scan.score >= 80 ? "#10b981" : scan.score >= 50 ? "#f59e0b" : "#ef4444"}; color: white; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 32px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-serious { background: #ffedd5; color: #9a3412; }
    .badge-moderate { background: #fef3c7; color: #92400e; }
    .badge-minor { background: #f1f5f9; color: #475569; }
    .code-box { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; overflow-x: auto; margin-top: 8px; }
    .disclaimer { margin-top: 40px; padding: 16px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 14px; color: #1e40af; }
  </style>
</head>
<body>
  <div class="header-card">
    <div>
      <h1 style="margin: 0 0 8px 0;">AccessLens AI — Audit Report</h1>
      <p style="margin: 0; color: #64748b;">Scan ID: <code>${scan.id}</code> | Created: ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="score-circle">${Math.round(scan.score)}</div>
  </div>

  <h2>Findings Summary</h2>
  <table>
    <thead>
      <tr><th>Rule</th><th>Severity</th><th>WCAG</th><th>Selector</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${issues
        .map(
          (i) => `
        <tr>
          <td><strong>${i.ruleId}</strong></td>
          <td><span class="badge badge-${i.impact}">${i.impact}</span></td>
          <td>${i.wcag.join(", ") || "Best Practice"}</td>
          <td><code>${i.selector}</code></td>
          <td>${i.status}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="disclaimer">
    <strong>Notice:</strong> Automated checks cover only part of WCAG. Items marked 'Needs manual review' require human testing.
  </div>
</body>
</html>`;
    }

    return exportScanResponseSchema.parse({
      format: query.format,
      content,
    });
  });
};
