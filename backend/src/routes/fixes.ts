import type { FastifyPluginAsync } from "fastify";
import PQueue from "p-queue";
import { z } from "zod";

import {
  applyFixesRequestSchema,
  applyFixesResponseSchema,
  explainIssueRequestSchema,
  explainIssueResponseSchema,
  generateFixesRequestSchema,
  generateFixesResponseSchema,
  // getScanParamsSchema is defined locally to avoid missing export
  // issueSchema remains imported
  issueSchema,
  type Fix,
  type Issue,
} from "@accesslens/shared";
import { prisma } from "../lib/prisma.js";
import { progressBroker } from "../services/progress.js";
import { explainIssue, generateFixBatch } from "../services/remediation.js";
import { gatherIssueContext, type IssueContext } from "../services/scanner.js";
import { parseOrReply, toIssue, toScan } from "./helpers.js";

export const fixRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/scans/:id/fixes", async (request, reply) => {
    const getScanParamsSchema = z.object({ id: z.string().min(1) });
  const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(generateFixesRequestSchema, request.body, reply);
    if (!body) return;
    const scan = await prisma.scan.findUnique({ where: { id: params.id }, include: { issues: true } });
    if (!scan) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });

    const requested = new Set(body.issueIds ?? scan.issues.map((issue) => issue.id));
    const openIssues = scan.issues.filter((issue) => issue.status === "open" && requested.has(issue.id));
    const html = scan.html ?? "";
    const queue = new PQueue({ concurrency: 3 });

    progressBroker.emit(scan.id, "queued", `Generating fixes for ${openIssues.length} issues`);

    type Prepared = { issue: Issue; context: IssueContext };
    const prepared = (
      await Promise.all(
        openIssues.map(async (issue): Promise<Prepared | undefined> => {
          try {
            const context = await gatherIssueContext(html, issue.selector);
            return { issue: issueSchema.parse({ ...issue, wcag: JSON.parse(issue.wcag) as unknown }), context };
          } catch {
            await prisma.issue.update({ where: { id: issue.id }, data: { status: "manual" } });
            return undefined;
          }
        })
      )
    ).filter((item): item is Prepared => item !== undefined);

    const groups = new Map<string, Prepared[]>();
    for (const item of prepared) groups.set(item.issue.ruleId, [...(groups.get(item.issue.ruleId) ?? []), item]);
    const fixes: Fix[] = [];
    progressBroker.emit(scan.id, "detecting", "Requesting remediation proposals");
    progressBroker.emit(scan.id, "normalizing", "Persisting remediation proposals");

    await Promise.all(
      [...groups.values()].flatMap((group) => {
        const chunks = Array.from({ length: Math.ceil(group.length / 8) }, (_, index) => group.slice(index * 8, index * 8 + 8));
        return chunks.map((chunk) =>
          queue.add(async () => {
            try {
              const generated = await generateFixBatch(chunk);
              for (const [index, proposal] of generated.entries()) {
                const item = chunk[index]!;
                const fix = await prisma.fix.create({
                  data: {
                    issueId: item.issue.id,
                    selector: item.issue.selector,
                    originalHtml: item.context.outerHTML,
                    fixedHtml: proposal.fixedHtml,
                    explanation: proposal.explanation,
                    confidence: proposal.confidence,
                    needsHumanReview: proposal.needsHumanReview,
                    verified: false,
                  },
                });
                fixes.push(fix);
              }
            } catch {
              await prisma.issue.updateMany({ where: { id: { in: chunk.map((item) => item.issue.id) } }, data: { status: "manual" } });
            }
          })
        );
      })
    );

    progressBroker.emit(scan.id, "done", `Generated ${fixes.length} fixes`);
    return generateFixesResponseSchema.parse({ scanId: scan.id, fixes });
  });

  app.post("/api/scans/:id/apply", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(applyFixesRequestSchema, request.body, reply);
    if (!body) return;

    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
      include: { issues: { include: { fixes: true } } },
    });
    if (!scan) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });

    const fixSet = new Set(body.fixIds);
    const fixesToApply = scan.issues.flatMap((i) => i.fixes).filter((f) => fixSet.has(f.id));

    let patchedHtml = scan.html ?? "";
    const appliedFixIds: string[] = [];
    const resolvedIssueIds: string[] = [];

    for (const fix of fixesToApply) {
      if (patchedHtml.includes(fix.originalHtml)) {
        patchedHtml = patchedHtml.replace(fix.originalHtml, fix.fixedHtml);
        appliedFixIds.push(fix.id);
        resolvedIssueIds.push(fix.issueId);
      } else {
        // Attempt trimmed or flexible match if exact whitespace differed
        const trimmedOrig = fix.originalHtml.trim();
        if (trimmedOrig && patchedHtml.includes(trimmedOrig)) {
          patchedHtml = patchedHtml.replace(trimmedOrig, fix.fixedHtml.trim());
          appliedFixIds.push(fix.id);
          resolvedIssueIds.push(fix.issueId);
        }
      }
    }

    const updatedScan = await prisma.$transaction(async (tx) => {
      if (resolvedIssueIds.length > 0) {
        await tx.issue.updateMany({
          where: { id: { in: resolvedIssueIds } },
          data: { status: "fixed" },
        });
      }
      return tx.scan.update({
        where: { id: scan.id },
        data: { html: patchedHtml },
      });
    });

    progressBroker.emit(scan.id, "normalizing", `Applied ${appliedFixIds.length} fixes to page HTML`);

    return applyFixesResponseSchema.parse({
      scan: toScan(updatedScan),
      appliedFixIds,
    });
  });

  app.post("/api/scans/:id/explain", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(explainIssueRequestSchema, request.body, reply);
    if (!body) return;

    const issueRecord = await prisma.issue.findUnique({
      where: { id: body.issueId },
    });
    if (!issueRecord || issueRecord.scanId !== params.id) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Issue not found" });
    }

    const explanation = await explainIssue(toIssue(issueRecord));
    return explainIssueResponseSchema.parse({ explanation });
  });
};
