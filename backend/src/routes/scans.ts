import type { FastifyPluginAsync } from "fastify";
import PQueue from "p-queue";
import { createScanRequestSchema, createScanResponseSchema, getScanResponseSchema } from "@accesslens/shared";
import { prisma } from "../lib/prisma.js";
import { ValidationError } from "../lib/errors.js";
import { normalizeAxeViolations, normalizeIssues } from "../services/normalizer.js";
import { progressBroker } from "../services/progress.js";
import { scanHtml, scanUrl } from "../services/scanner.js";
import { calculateScore } from "../services/score.js";
import { searchAccessibilityBestPractices } from "../services/tavily.js";
import { parseOrReply, toScan, toIssue } from "./helpers.js";
import { z } from "zod";

const getScanParamsSchema = z.object({ id: z.string().min(1) });

const scanQueue = new PQueue({ concurrency: 2 });

export const scanRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/scans",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const input = parseOrReply(createScanRequestSchema, request.body, reply);
      if (!input) return;
      if (input.html && Buffer.byteLength(input.html, "utf8") > 500 * 1024) {
        throw new ValidationError("Pasted HTML must be 500KB or smaller");
      }

      const inputType = input.url ? "url" : "html";
      const created = await prisma.scan.create({ data: { inputType, url: input.url ?? null, html: input.html ?? null, score: 0 } });
      progressBroker.emit(created.id, "queued", "Scan is queued");

      const result = await scanQueue.add(async () => {
        try {
          progressBroker.emit(created.id, "rendering", "Rendering page");
          const raw = input.url ? await scanUrl(input.url, created.id) : await scanHtml(input.html!, created.id);
          progressBroker.emit(created.id, "detecting", "Running axe accessibility checks");
          progressBroker.emit(created.id, "normalizing", "Normalizing accessibility findings");
          const issues = normalizeIssues([...normalizeAxeViolations(created.id, raw.axe), ...raw.keyboardIssues]);

          // Tavily runtime call: search for best practices for detected issues
          if (issues.length > 0) {
            progressBroker.emit(created.id, "researching", "Searching accessibility best practices");
            const uniqueRules = [...new Set(issues.map((i) => i.ruleId))];
            for (const ruleId of uniqueRules.slice(0, 3)) {
              // Limit to top 3 rules to avoid excessive API calls
              const sampleIssue = issues.find((i) => i.ruleId === ruleId);
              if (sampleIssue) {
                try {
                  await searchAccessibilityBestPractices(ruleId, sampleIssue.wcag);
                } catch {
                  // Continue even if Tavily fails
                }
              }
            }
          }

          const score = calculateScore(issues);
          const scan = await prisma.$transaction(async (tx) => {
            await tx.issue.createMany({
              data: issues.map((issue) => ({
                scanId: created.id,
                ruleId: issue.ruleId,
                impact: issue.impact,
                wcag: JSON.stringify(issue.wcag),
                selector: issue.selector,
                html: issue.html,
                message: issue.message,
                source: issue.source,
                status: issue.status,
              })),
            });
            return tx.scan.update({ where: { id: created.id }, data: { html: raw.html, score }, include: { issues: true } });
          });
          progressBroker.emit(created.id, "done", "Scan complete");
          return scan;
        } catch (error) {
          progressBroker.emit(created.id, "error", error instanceof Error ? error.message : "Scan failed");
          throw error;
        }
      });
      if (!result) throw new Error("Scan queue did not return a result");

      const response = createScanResponseSchema.parse({ scan: toScan(result) });
      return reply.code(201).send(response);
    }
  );

  app.get("/api/scans/:id", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const record = await prisma.scan.findUnique({ where: { id: params.id }, include: { issues: { include: { fixes: true } } } });
    if (!record) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });
    return getScanResponseSchema.parse({
      scan: toScan(record),
      issues: record.issues.map(toIssue),
      fixes: record.issues.flatMap((issue) => issue.fixes).map((fix) => ({ ...fix, confidence: fix.confidence })),
    });
  });

  app.get("/api/scans/:id/stream", async (request, reply) => {
    const params = parseOrReply(getScanParamsSchema, request.params, reply);
    if (!params) return;
    const scan = await prisma.scan.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!scan) return reply.code(404).send({ error: "NOT_FOUND", message: "Scan not found" });
    reply.hijack();
    reply.raw.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    reply.raw.write(": connected\n\n");
    const unsubscribe = progressBroker.subscribe(params.id, (event) => {
      reply.raw.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
    });
    request.raw.once("close", () => unsubscribe());
  });
};
