import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// pnpm executes this workspace script from apps/api; configuration lives at the monorepo root.
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

const emptyToUndefined = (val: unknown) => (typeof val === "string" && val.trim() === "" ? undefined : val);

const envSchema = z.object({
  NEBIUS_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEBIUS_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEMOTRON_MODEL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  TAVILY_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
