# Multi-stage Dockerfile for AccessLens AI API
# Base image matches installed Playwright version ^1.49.1
FROM mcr.microsoft.com/playwright:v1.49.1-jammy AS base

# Install pnpm globally
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Stage 1: Dependencies installation
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Stage 2: Build packages & API
FROM dependencies AS builder
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY demo ./demo
COPY fixtures ./fixtures

RUN pnpm --filter @accesslens/shared build
RUN pnpm --filter @accesslens/api prisma:generate

# Stage 3: Production runner
FROM mcr.microsoft.com/playwright:v1.49.1-jammy AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

# Use non-root user 'pwuser' provided by playwright image
USER pwuser

COPY --chown=pwuser:pwuser package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=pwuser:pwuser --from=dependencies /app/node_modules ./node_modules
COPY --chown=pwuser:pwuser --from=builder /app/packages/shared ./packages/shared
COPY --chown=pwuser:pwuser --from=builder /app/apps/api ./apps/api
COPY --chown=pwuser:pwuser --from=builder /app/demo ./demo
COPY --chown=pwuser:pwuser --from=builder /app/fixtures ./fixtures

EXPOSE 4000

# Healthcheck on /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

WORKDIR /app/apps/api
CMD ["node", "--loader", "tsx", "src/index.ts"]
