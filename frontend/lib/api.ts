import {
  applyFixesRequestSchema,
  applyFixesResponseSchema,
  createScanRequestSchema,
  createScanResponseSchema,
  explainIssueRequestSchema,
  explainIssueResponseSchema,
  exportScanQuerySchema,
  exportScanResponseSchema,
  generateFixesRequestSchema,
  generateFixesResponseSchema,
  getScanResponseSchema,
  verifyScanRequestSchema,
  verifyScanResponseSchema,
  type ApplyFixesResponse,
  type CreateScanRequest,
  type CreateScanResponse,
  type GetScanResponse,
  type VerifyScanResponse,
} from "@accesslens/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
  schema?: { parse: (data: unknown) => T }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = (await response.json()) as { error?: string; message?: string };
      errorCode = errorJson.error || errorCode;
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Use fallback
    }
    throw new ApiError(response.status, errorCode, errorMessage);
  }

  const json = (await response.json()) as unknown;
  return schema ? schema.parse(json) : (json as T);
}

export const api = {
  async createScan(input: CreateScanRequest): Promise<CreateScanResponse> {
    const validated = createScanRequestSchema.parse(input);
    return request("/api/scans", {
      method: "POST",
      body: JSON.stringify(validated),
    }, createScanResponseSchema);
  },

  async getScan(id: string): Promise<GetScanResponse> {
    return request(`/api/scans/${encodeURIComponent(id)}`, {
      method: "GET",
    }, getScanResponseSchema);
  },

  async generateFixes(id: string, issueIds?: string[]) {
    const body = generateFixesRequestSchema.parse({ issueIds });
    return request(`/api/scans/${encodeURIComponent(id)}/fixes`, {
      method: "POST",
      body: JSON.stringify(body),
    }, generateFixesResponseSchema);
  },

  async applyFixes(id: string, fixIds: string[]): Promise<ApplyFixesResponse> {
    const body = applyFixesRequestSchema.parse({ fixIds });
    return request(`/api/scans/${encodeURIComponent(id)}/apply`, {
      method: "POST",
      body: JSON.stringify(body),
    }, applyFixesResponseSchema);
  },

  async verifyScan(id: string, html?: string): Promise<VerifyScanResponse> {
    const body = verifyScanRequestSchema.parse({ html });
    return request(`/api/scans/${encodeURIComponent(id)}/verify`, {
      method: "POST",
      body: JSON.stringify(body),
    }, verifyScanResponseSchema);
  },

  async explainIssue(scanId: string, issueId: string): Promise<string> {
    const body = explainIssueRequestSchema.parse({ issueId });
    const res = await request(
      `/api/scans/${encodeURIComponent(scanId)}/explain`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      explainIssueResponseSchema
    );
    return res.explanation;
  },

  async exportScan(scanId: string, format: "html" | "json" | "md"): Promise<string> {
    const query = exportScanQuerySchema.parse({ format });
    const res = await request(
      `/api/scans/${encodeURIComponent(scanId)}/export?format=${query.format}`,
      { method: "GET" },
      exportScanResponseSchema
    );
    return res.content;
  },

  async getDemoHtml(filename: string = "broken-site.html"): Promise<string> {
    const response = await fetch(`${API_BASE}/demo/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load demo HTML: ${response.statusText}`);
    }
    return response.text();
  },

  getStreamUrl(scanId: string): string {
    return `${API_BASE}/api/scans/${encodeURIComponent(scanId)}/stream`;
  },
};
