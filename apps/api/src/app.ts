import { existsSync, readFileSync } from "node:fs";
import { resolve, normalize, extname } from "node:path";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { healthResponseSchema } from "@accesslens/shared";
import { env } from "./env.js";
import { ValidationError } from "./lib/errors.js";
import { exportRoutes } from "./routes/export.js";
import { fixRoutes } from "./routes/fixes.js";
import { scanRoutes } from "./routes/scans.js";
import { verifyRoutes } from "./routes/verify.js";
import { closeBrowser } from "./services/scanner.js";
import { prisma } from "./lib/prisma.js";

function getDemoDir(): string {
  const candidates = [
    resolve(process.cwd(), "../../demo"),
    resolve(process.cwd(), "demo"),
    resolve(process.cwd(), "../demo"),
  ];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0]!;
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

export function buildApp() {
  const app = Fastify({
    bodyLimit: 512 * 1024, // 500KB strict body limit
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: {
        paths: ["req.headers.authorization", "*.apiKey", "*.NEBIUS_API_KEY"],
        censor: "[REDACTED]",
      },
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
  });

  // Strict CORS from ALLOWED_ORIGIN
  app.register(cors, {
    origin: env.ALLOWED_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  // Global rate limiter fallback
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Helmet-style security headers
  app.addHook("onRequest", async (_request, reply) => {
    void reply.header("X-Content-Type-Options", "nosniff");
    void reply.header("X-Frame-Options", "SAMEORIGIN");
    void reply.header("X-XSS-Protection", "1; mode=block");
    void reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    void reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (error instanceof ValidationError) {
      void reply.status(400).send({ error: error.code, message: error.message });
      return;
    }
    void reply.status(500).send({ error: "INTERNAL_SERVER_ERROR", message: "Unexpected server error" });
  });

  // Root and Healthcheck endpoints
  app.get("/", async () => ({
    name: "AccessLens API",
    status: "ok",
    frontend: "http://localhost:3000",
    health: "/health",
    demo: "/demo/broken-site.html",
  }));
  app.get("/health", async () => healthResponseSchema.parse({ status: "ok" }));

  // Statically serve demo/ directory at /demo/*
  const demoDir = getDemoDir();
  app.get("/demo/*", async (request, reply) => {
    const rawPath = (request.params as { "*": string })["*"] || "broken-site.html";
    const safePath = normalize(rawPath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = resolve(demoDir, safePath);

    // Prevent directory traversal outside demo directory
    if (!fullPath.startsWith(demoDir) || !existsSync(fullPath)) {
      return reply.code(404).send({ error: "NOT_FOUND", message: "Demo file not found" });
    }

    const ext = extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || "text/plain; charset=utf-8";
    const fileContent = readFileSync(fullPath);
    void reply.type(contentType).send(fileContent);
  });

  // Business API routes
  app.register(scanRoutes);
  app.register(fixRoutes);
  app.register(verifyRoutes);
  app.register(exportRoutes);

  return app;
}

export async function gracefulShutdown(app: ReturnType<typeof buildApp>): Promise<void> {
  try {
    await app.close();
  } catch {
    // Continue
  }
  try {
    await closeBrowser();
  } catch {
    // Continue
  }
  try {
    await prisma.$disconnect();
  } catch {
    // Continue
  }
}
