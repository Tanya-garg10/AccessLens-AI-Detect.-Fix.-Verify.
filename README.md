# AccessLens AI

> Detect. Fix. Verify. — AI-powered WCAG 2.2 accessibility agent with deterministic axe-core verification.

AccessLens AI automatically scans web pages for accessibility violations, generates AI-powered fixes, and verifies them with deterministic axe-core audits.

---

## Project Structure

```
AccessLens AI/
├── frontend/          ◀ Next.js 14 App Router UI  (runs on :3000)
│   ├── app/           — Pages & layouts (App Router)
│   ├── components/    — Reusable UI components
│   ├── lib/           — API client, utilities
│   ├── types/         — Shared Zod schemas & TypeScript types
│   └── package.json
│
├── backend/           ◀ Fastify REST API  (runs on :4000)
│   ├── src/
│   │   ├── routes/    — HTTP route handlers (scans, fixes, verify, export)
│   │   ├── services/  — Business logic (scanner, remediation, contrast, keyboard)
│   │   └── lib/       — Prisma client, LLM client, SSRF guard
│   ├── prisma/        — Database schema (SQLite local / PostgreSQL prod)
│   ├── types/         — Shared Zod schemas & TypeScript types
│   └── package.json
│
├── demo/              — Demo broken HTML page for testing
├── docs/              — DEMO.md walkthrough script
└── docker-compose.yml — One-command local dev setup
```

---

## Overview

AccessLens AI is a full-stack accessibility testing tool that combines:

- **Automated scanning** using axe-core with 90+ WCAG 2.2 rules
- **AI-powered remediation** using GPT-4o for contextual fixes
- **Deterministic verification** with re-auditing to ensure compliance
- **Keyboard navigation testing** via Playwright simulation
- **Real-time progress** with Server-Sent Events
- **Export reports** in HTML, JSON, or Markdown formats

---

## Features

- **Automated WCAG 2.2 scanning** — headless Chromium + axe-core with 90+ rules
- **Keyboard navigation simulation** — Tab/Shift-Tab traversal via Playwright
- **AI code remediation** — contextual minimal patches per violation
- **Deterministic verification** — AI can't self-certify; axe-core re-audits every patch
- **Monaco diff viewer** — side-by-side original vs. fixed HTML
- **Live SSE progress** — real-time scan pipeline updates
- **Export** — HTML, JSON, Markdown reports
- **Full accessibility** — WCAG 2.2 compliant UI with skip link, aria-live regions, 4.5:1 contrast

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Monaco Editor |
| **Backend** | Fastify, TypeScript, Prisma ORM, axe-core, Playwright |
| **AI** | OpenAI GPT-4o / GPT-4o-mini |
| **Database** | SQLite (dev) · PostgreSQL (prod) |
| **Accessibility Engine** | axe-core WCAG 2.2 + Playwright keyboard simulation |

---

## Quick Start

### 1. Backend

```bash
cd backend

# Install dependencies
npm install       # or: pnpm install

# Set up environment
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY

# Set up database
npx prisma migrate dev --name init
npx prisma generate

# Start dev server  →  http://localhost:4000
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install       # or: pnpm install

# Set up environment
cp .env.example .env.local

# Start dev server  →  http://localhost:3000
npm run dev
```

### 3. Both at once (Docker Compose)

```bash
# From project root
docker compose up
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | API port (default: `4000`) |
| `DATABASE_URL` | SQLite `file:./dev.db` or PostgreSQL connection string |
| `ALLOWED_ORIGIN` | CORS origin — set to your frontend URL |
| `OPENAI_API_KEY` | Required for AI remediation |
| `OPENAI_MODEL` | Optional — defaults to `gpt-4o-mini` |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000`) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scans` | Create a new scan (URL or HTML) |
| `GET` | `/scans/:id` | Get scan result with issues & fixes |
| `GET` | `/scans/:id/stream` | SSE progress stream |
| `POST` | `/scans/:id/fixes` | Generate AI fix proposals |
| `POST` | `/scans/:id/fixes/apply` | Apply selected fixes |
| `POST` | `/scans/:id/verify` | Re-audit patched HTML |
| `GET` | `/scans/:id/export` | Export report (html/json/md) |
