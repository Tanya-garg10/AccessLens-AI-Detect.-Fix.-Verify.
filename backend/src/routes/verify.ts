import type { FastifyPluginAsync } from "fastify";
import { verifyScanRequestSchema, verifyScanResponseSchema } from "@accesslens/shared";
import { prisma } from "../lib/prisma.js";
import { normalizeAxeViolations, normalizeIssues } from "../services/normalizer.js";
import { progressBroker } from "../services/progress.js";
import { scanHtml } from "../services/scanner.js";
import { calculateScore } from "../services/score.js";
import { parseOrReply, toIssue, toScan } from "./helpers.js";
import { z } from "zod";

const getScanParamsSchema = z.object({ id: z.string().min(1) });

export const verifyRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/scans/:id/verify", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(verifyScanRequestSchema, request.body, reply);
    if (!body) return;

    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
      include: { issues: { include: { fixes: true } } },
    });
    if (!scan) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });

    const targetHtml = body.html ?? scan.html ?? "";
    if (!targetHtml) {
      return reply.code(400).send({ error: "INVALID_REQUEST", message: "No HTML content available to verify" });
    }

    progressBroker.emit(scan.id, "rendering", "Verifying patched page with axe-core");
    const raw = await scanHtml(targetHtml, scan.id);

    progressBroker.emit(scan.id, "detecting", "Running deterministic verification rules");
    const survivingIssues = normalizeIssues([...normalizeAxeViolations(scan.id, raw.axe), ...raw.keyboardIssues]);
    const newScore = calculateScore(survivingIssues);

    progressBroker.emit(scan.id, "normalizing", "Comparing before and after issue states");

    // Map surviving issues by ruleId + selector
    const survivingSet = new Set(survivingIssues.map((i) => `${i.ruleId}\u0000${i.selector}`));

    // Update statuses for original scan issues
    const updatedIssues = await prisma.$transaction(async (tx) => {
      for (const issue of scan.issues) {
        const key = `${issue.ruleId}\u0000${issue.selector}`;
        const isStillFailing = survivingSet.has(key);
        const newStatus = isStillFailing ? "open" : "fixed";

        if (issue.status !== newStatus) {
          await tx.issue.update({
            where: { id: issue.id },
            data: { status: newStatus },
          });
        }

        // If issue is fixed, mark all its fixes as verified = true
        if (!isStillFailing && issue.fixes.length > 0) {
          await tx.fix.updateMany({
            where: { issueId: issue.id },
            data: { verified: true },
          });
        }
      }

      await tx.scan.update({
        where: { id: scan.id },
        data: { score: newScore, html: raw.html },
      });

      return tx.issue.findMany({
        where: { scanId: scan.id },
        include: { fixes: true },
      });
    });

    progressBroker.emit(scan.id, "done", `Verification complete: verified score is ${newScore}`);

    const refreshedScan = await prisma.scan.findUniqueOrThrow({
      where: { id: scan.id },
    });

    return verifyScanResponseSchema.parse({
      scan: toScan(refreshedScan),
      issues: updatedIssues.map(toIssue),
      verified: true,
    });
  });
};
