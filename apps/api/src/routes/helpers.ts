import type { FastifyReply } from "fastify";
import type { ZodType } from "zod";
import { issueSchema, scanSchema, type Issue, type Scan } from "@accesslens/shared";

export function parseOrReply<T>(schema: ZodType<T>, payload: unknown, reply: FastifyReply): T | undefined {
  const result = schema.safeParse(payload);
  if (!result.success) {
    void reply.code(400).send({ error: "VALIDATION_ERROR", message: result.error.message });
    return undefined;
  }
  return result.data;
}

export function notImplemented(reply: FastifyReply): void {
  void reply.code(501).send({ error: "NOT_IMPLEMENTED", message: "Business logic has not been implemented yet." });
}

export function toScan(record: {
  id: string;
  inputType: string;
  url: string | null;
  html: string | null;
  score: number;
  createdAt: Date;
  parentScanId: string | null;
}): Scan {
  return scanSchema.parse({
    id: record.id,
    inputType: record.inputType,
    ...(record.url ? { url: record.url } : {}),
    ...(record.html ? { html: record.html } : {}),
    score: record.score,
    createdAt: record.createdAt.toISOString(),
    ...(record.parentScanId ? { parentScanId: record.parentScanId } : {}),
  });
}

export function toIssue(record: {
  id: string;
  scanId: string;
  ruleId: string;
  impact: string;
  wcag: string;
  selector: string;
  html: string;
  message: string;
  source: string;
  status: string;
}): Issue {
  return issueSchema.parse({ ...record, wcag: JSON.parse(record.wcag) as unknown });
}
