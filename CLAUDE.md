# CLAUDE.md — Healynx Project Guide

## Project Overview

Healynx is a clinical AI platform for pandemic response. It uses LangGraph agent orchestration to run mutation surveillance, drug analysis, resistance prediction, and treatment recommendation pipelines.

## Architecture

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + LangGraph + Groq LLM
- **Database**: Neon (PostgreSQL) — schema managed via Drizzle ORM from the Next.js side
- **Auth**: JWT (python-jose on backend, cookies on frontend)

## Running the Project

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Neon database (set DATABASE_URL)
- A Groq API key (set GROQ_API_KEY)

### First-time setup (run once after cloning)

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

**Mac / Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

This single command:
- Creates `backend/.venv` and installs all Python packages
- Runs `npm install` for frontend packages
- Patches your shell profile so the venv **auto-activates** whenever
  you open a terminal in this project folder (any path, any machine)

### After setup — fill in secrets
```
.env.local        ← DATABASE_URL, NEXT_PUBLIC_API_URL
backend/.env      ← DATABASE_URL, GROQ_API_KEY
```
Copy from `.env.example` and fill in your values.

### Push schema + seed data (first time only)
```bash
npm run db:push          # Push Drizzle schema to Neon
cd backend
python db/seed.py        # Create demo doctor + patients
```

### Start the servers
```bash
# Terminal 1 — Backend (venv auto-activates)
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
npm run dev              # http://localhost:3000
```

### Demo Login
- Doctor: `doctor@protengine.ai` / `demo1234`

## Environment Variables

All secrets go in `.env.local` (frontend) and `backend/.env` (Python). Never commit these files.

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `GROQ_API_KEY` — Groq API key for LLM

Optional:
- `NCBI_API_KEY` / `NCBI_EMAIL` — for higher NCBI rate limits
- `TELEGRAM_BOT_TOKEN` — for Telegram alerts
- `LANGCHAIN_API_KEY` — for LangSmith tracing

## Code Style

- **Frontend**: BiomeJS (not ESLint). Run `npm run check` before commits.
- **Backend**: Standard Python. No formatter enforced.
- **No `any` in TypeScript** — all types defined in `types/index.ts`
- **No hardcoded data** — all data from database

## Key Design Rules

- Dark theme always (`--bg-base: #0a0b0d`)
- No mock/dummy/fallback data — show empty states
- Space Mono for all numbers and monospace data
- DM Sans for body text

## Agent Pipeline Order

PlannerAgent → FetchAgent → MutationParserAgent → StructurePrepAgent → DockingAgent → ADMETAgent → ResistanceAgent → SelectivityAgent → SimilaritySearchAgent → ExplainabilityAgent → ReportAgent

## Commit Format

```
feat: add doctor patient detail page with pipeline runner
fix: pipeline SSE stream not closing after completion
feat: add Telegram alert dispatch for critical patients
```
