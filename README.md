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
| **AI** | NVIDIA Nemotron / OpenAI GPT-4o / GPT-4o-mini |
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

## License

This project is licensed under the **MIT License** — an approved OSI open-source license.

```
MIT License

Copyright (c) 2026 AccessLens AI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## NVIDIA Nemotron & Token Factory Integration

### NVIDIA Nemotron Usage

AccessLens AI leverages **NVIDIA Nemotron** models for advanced accessibility remediation tasks:

- **Code Context Understanding**: Nemotron's strong code comprehension capabilities enable the system to understand complex HTML structures and generate contextually appropriate accessibility fixes
- **Minimal Patch Generation**: The model is optimized to produce minimal, targeted fixes rather than rewriting entire code sections, ensuring safer and more maintainable changes
- **Multi-Language Support**: Nemotron's training on diverse codebases allows it to handle various web frameworks and coding patterns in accessibility remediation

### Token Factory Acceleration

**Token Factory** significantly accelerated our development workflow in the following areas:

1. **Rapid Prototyping**: Enabled quick iteration on AI remediation prompts and strategies by providing immediate feedback on token usage and costs
2. **Cost Optimization**: Real-time token tracking helped optimize the balance between model performance and operational costs for large-scale accessibility audits
3. **Prompt Engineering**: Streamlined the process of fine-tuning prompts for different accessibility rule categories (WCAG 2.2 levels A, AA, AAA)
4. **Batch Processing**: Accelerated testing of remediation strategies across multiple violation types simultaneously

### Nebius Tools & Services

The following Nebius Tools and Services were utilized in the development of AccessLens AI:

- **GPU-Accelerated Inference**: Used Nebius GPU infrastructure for faster model inference during the development and testing phases
- **Model Hosting**: Leveraged Nebius cloud services for hosting and scaling the AI remediation service
- **Development Environment**: Nebius development tools facilitated efficient model integration and testing workflows

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
