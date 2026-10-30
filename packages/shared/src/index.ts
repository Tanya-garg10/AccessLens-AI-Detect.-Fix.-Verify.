import { z } from "zod";

export const issueImpactSchema = z.enum(["critical", "serious", "moderate", "minor"]);
export const issueSourceSchema = z.enum(["axe", "custom"]);
export const issueStatusSchema = z.enum(["open", "fixed", "unverified", "manual"]);
export const scanInputTypeSchema = z.enum(["url", "html"]);
export const exportFormatSchema = z.enum(["html", "json", "md"]);
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string().optional(),
  aiConfigured: z.boolean().optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
});

export const auditSummaryItemSchema = z.object({
  id: z.string(),
  inputType: scanInputTypeSchema,
  url: z.string().optional(),
  score: z.number(),
  createdAt: z.string(),
  issuesCount: z.number(),
  fixedCount: z.number(),
  criticalCount: z.number(),
  seriousCount: z.number(),
  moderateCount: z.number(),
  minorCount: z.number(),
});

export const listAuditsResponseSchema = z.object({
  totalAudits: z.number(),
  totalIssues: z.number(),
  totalVerified: z.number(),
  averageScore: z.number(),
  severityCounts: z.object({
    critical: z.number(),
    serious: z.number(),
    moderate: z.number(),
    minor: z.number(),
  }),
  audits: z.array(auditSummaryItemSchema),
});

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

// Any future model output must be parsed against this contract before it can be used.
// Verification fields are intentionally absent: deterministic checks own that decision.
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
export const llmContrastSuggestionSchema = z.object({ foregroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/) });

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

export const createScanRequestSchema = z
  .object({ url: z.string().url().optional(), html: z.string().min(1).optional() })
  .superRefine((value, ctx) => {
    if (Boolean(value.url) === Boolean(value.html)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide exactly one of url or html", path: ["url"] });
    }
  });

export const createScanResponseSchema = z.object({ scan: scanSchema });
export const getScanParamsSchema = z.object({ id: z.string().min(1) });
export const getScanResponseSchema = z.object({ scan: scanSchema, issues: z.array(issueSchema), fixes: z.array(fixSchema) });
export const scanProgressStageSchema = z.enum(["queued", "rendering", "detecting", "normalizing", "done", "error"]);
export const streamScanResponseSchema = z.object({ event: scanProgressStageSchema, data: z.object({ scanId: z.string(), message: z.string() }) });
export const generateFixesRequestSchema = z.object({ issueIds: z.array(z.string().min(1)).min(1).optional() });
export const generateFixesResponseSchema = z.object({ scanId: z.string(), fixes: z.array(fixSchema) });
export const explainIssueRequestSchema = z.object({ issueId: z.string().min(1) });
export const explainIssueResponseSchema = z.object({ explanation: z.string().min(1) });
export const applyFixesRequestSchema = z.object({ fixIds: z.array(z.string().min(1)).min(1) });
export const applyFixesResponseSchema = z.object({ scan: scanSchema, appliedFixIds: z.array(z.string()) });
export const verifyScanRequestSchema = z.object({ html: z.string().min(1).optional() });
export const verifyScanResponseSchema = z.object({ scan: scanSchema, issues: z.array(issueSchema), verified: z.boolean() });
export const exportScanQuerySchema = z.object({ format: exportFormatSchema });
export const exportScanResponseSchema = z.object({ format: exportFormatSchema, content: z.string() });
export const errorResponseSchema = z.object({ error: z.string(), message: z.string() });

export type Issue = z.infer<typeof issueSchema>;
export type Fix = z.infer<typeof fixSchema>;
export type Scan = z.infer<typeof scanSchema>;
export type CreateScanRequest = z.infer<typeof createScanRequestSchema>;
export type CreateScanResponse = z.infer<typeof createScanResponseSchema>;
export type GetScanResponse = z.infer<typeof getScanResponseSchema>;
export type GenerateFixesRequest = z.infer<typeof generateFixesRequestSchema>;
export type ApplyFixesRequest = z.infer<typeof applyFixesRequestSchema>;
export type VerifyScanRequest = z.infer<typeof verifyScanRequestSchema>;
export type LlmFixProposal = z.infer<typeof llmFixProposalSchema>;
export type LlmRemediation = z.infer<typeof llmRemediationSchema>;
export type GenerateFixesResponse = z.infer<typeof generateFixesResponseSchema>;
export type ApplyFixesResponse = z.infer<typeof applyFixesResponseSchema>;
export type VerifyScanResponse = z.infer<typeof verifyScanResponseSchema>;
export type ExplainIssueRequest = z.infer<typeof explainIssueRequestSchema>;
export type ExplainIssueResponse = z.infer<typeof explainIssueResponseSchema>;
export type ExportScanResponse = z.infer<typeof exportScanResponseSchema>;
export type AuditSummaryItem = z.infer<typeof auditSummaryItemSchema>;
export type ListAuditsResponse = z.infer<typeof listAuditsResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;

