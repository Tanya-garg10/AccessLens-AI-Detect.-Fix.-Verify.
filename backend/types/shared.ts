import { z } from "zod";

// ─── Enums ─────────────────────────────────────────────────────────────────────
export const issueImpactSchema = z.enum(["critical", "serious", "moderate", "minor"]);
export const issueSourceSchema = z.enum(["axe", "custom"]);
export const issueStatusSchema = z.enum(["open", "fixed", "unverified", "manual"]);
export const scanInputTypeSchema = z.enum(["url", "html"]);
export const exportFormatSchema = z.enum(["html", "json", "md"]);
export const scanProgressStageSchema = z.enum(["queued", "rendering", "detecting", "normalizing", "done", "error"]);

// ─── Core models ────────────────────────────────────────────────────────────────
export const issueSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  ruleId: z.string(),
  impact: issueImpactSchema,
  wcag: z.array(z.string()),
  selector: z.string(),
  html: z.string(),
  message: z.string(),
  source: issueSourceSchema,
  status: issueStatusSchema,
});

export const fixSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  selector: z.string(),
  originalHtml: z.string(),
  fixedHtml: z.string(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
  verified: z.boolean(),
});

export const scanSchema = z
  .object({
    id: z.string(),
    inputType: scanInputTypeSchema,
    url: z.string().url().optional(),
    html: z.string().min(1).optional(),
    score: z.number().min(0).max(100),
    createdAt: z.string().datetime(),
    parentScanId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.inputType === "url" && !value.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "url is required for URL scans", path: ["url"] });
    }
    if (value.inputType === "html" && !value.html) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "html is required for HTML scans", path: ["html"] });
    }
  });

// ─── Request / Response schemas ─────────────────────────────────────────────────
export const createScanRequestSchema = z
  .object({ url: z.string().url().optional(), html: z.string().min(1).optional() })
  .superRefine((value, ctx) => {
    if (Boolean(value.url) === Boolean(value.html)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide exactly one of url or html", path: ["url"] });
    }
  });

export const createScanResponseSchema = z.object({ scan: scanSchema });

export const getScanResponseSchema = z.object({
  scan: scanSchema,
  issues: z.array(issueSchema),
  fixes: z.array(fixSchema),
});

export const generateFixesRequestSchema = z.object({
  issueIds: z.array(z.string().min(1)).min(1).optional(),
});
export const generateFixesResponseSchema = z.object({
  scanId: z.string(),
  fixes: z.array(fixSchema),
});

export const applyFixesRequestSchema = z.object({
  fixIds: z.array(z.string().min(1)).min(1),
});
export const applyFixesResponseSchema = z.object({
  scan: scanSchema,
  appliedFixIds: z.array(z.string()),
});

export const verifyScanRequestSchema = z.object({ html: z.string().min(1).optional() });
export const verifyScanResponseSchema = z.object({
  scan: scanSchema,
  issues: z.array(issueSchema),
  verified: z.boolean(),
});

export const explainIssueRequestSchema = z.object({ issueId: z.string().min(1) });
export const explainIssueResponseSchema = z.object({ explanation: z.string().min(1) });

export const exportScanQuerySchema = z.object({ format: exportFormatSchema });
export const exportScanResponseSchema = z.object({ format: exportFormatSchema, content: z.string() });

export const errorResponseSchema = z.object({ error: z.string(), message: z.string() });
export const healthResponseSchema = z.object({ status: z.literal("ok") });

// ─── LLM output schemas (used internally by backend) ────────────────────────────
export const llmFixProposalSchema = z.object({
  selector: z.string().min(1),
  originalHtml: z.string().min(1),
  fixedHtml: z.string().min(1),
  explanation: z.string().min(1),
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
});
export const llmFixProposalsSchema = z.object({ proposals: z.array(llmFixProposalSchema) });
export const llmRemediationSchema = z.object({
  fixedHtml: z.string().min(1),
  explanation: z.string().min(1),
  wcagCriteria: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
});
export const llmRemediationBatchSchema = z.object({ fixes: z.array(llmRemediationSchema).min(1) });
export const llmContrastSuggestionSchema = z.object({
  foregroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const streamScanResponseSchema = z.object({
  event: scanProgressStageSchema,
  data: z.object({ scanId: z.string(), message: z.string() }),
});

// ─── TypeScript types ────────────────────────────────────────────────────────────
export type Issue = z.infer<typeof issueSchema>;
export type Fix = z.infer<typeof fixSchema>;
export type Scan = z.infer<typeof scanSchema>;
export type CreateScanRequest = z.infer<typeof createScanRequestSchema>;
export type CreateScanResponse = z.infer<typeof createScanResponseSchema>;
export type GetScanResponse = z.infer<typeof getScanResponseSchema>;
export type GenerateFixesRequest = z.infer<typeof generateFixesRequestSchema>;
export type GenerateFixesResponse = z.infer<typeof generateFixesResponseSchema>;
export type ApplyFixesRequest = z.infer<typeof applyFixesRequestSchema>;
export type ApplyFixesResponse = z.infer<typeof applyFixesResponseSchema>;
export type VerifyScanRequest = z.infer<typeof verifyScanRequestSchema>;
export type VerifyScanResponse = z.infer<typeof verifyScanResponseSchema>;
export type ExplainIssueRequest = z.infer<typeof explainIssueRequestSchema>;
export type ExplainIssueResponse = z.infer<typeof explainIssueResponseSchema>;
export type ExportScanResponse = z.infer<typeof exportScanResponseSchema>;
export type LlmFixProposal = z.infer<typeof llmFixProposalSchema>;
export type LlmRemediation = z.infer<typeof llmRemediationSchema>;
