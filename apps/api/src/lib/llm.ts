import OpenAI from "openai";
import type { ZodType } from "zod";
import { env } from "../env.js";

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function extractJsonObject(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  if (start < 0) throw new Error("Model response did not contain a JSON object");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (escaped) escaped = false;
    else if (char === "\\") escaped = true;
    else if (char === '"') inString = !inString;
    else if (!inString && char === "{") depth += 1;
    else if (!inString && char === "}" && --depth === 0) return JSON.parse(cleaned.slice(start, index + 1));
  }
  throw new Error("Model response contained incomplete JSON");
}

function retryable(error: unknown): boolean {
  const status = typeof error === "object" && error !== null && "status" in error ? (error as { status?: unknown }).status : undefined;
  return status === 429 || (typeof status === "number" && status >= 500);
}

export async function requestJson<T>(system: string, user: string, schema: ZodType<T>): Promise<T> {
  if (!env.NEBIUS_API_KEY || !env.NEBIUS_BASE_URL || !env.NEMOTRON_MODEL) throw new Error("LLM is not configured");
  const client = new OpenAI({ baseURL: env.NEBIUS_BASE_URL, apiKey: env.NEBIUS_API_KEY, timeout: 30_000, maxRetries: 0 });
  let responseFormat = true;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.chat.completions.create({ model: env.NEMOTRON_MODEL, temperature: 0.1, messages: [{ role: "system", content: system }, { role: "user", content: user }], ...(responseFormat ? { response_format: { type: "json_object" } } : {}) });
      return schema.parse(extractJsonObject(response.choices[0]?.message.content ?? ""));
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? (error as { status?: unknown }).status : undefined;
      if (status === 400 && responseFormat) { responseFormat = false; continue; }
      if (attempt < 2 && retryable(error)) { await delay(250 * 2 ** attempt); continue; }
      throw error;
    }
  }
  throw new Error("LLM request exhausted retries");
}
