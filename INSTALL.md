# Healynx Installation Guide

Quick setup for new team members.

## Prerequisites

- **Python 3.11+** - [Download](https://python.org)
- **Node.js 18+** - [Download](https://nodejs.org)
- **Git** - [Download](https://git-scm.com)

## Step 1: Clone & Setup

```powershell
# On Windows, in PowerShell:
powershell -ExecutionPolicy Bypass -File setup.ps1
```

This single command:
- ✅ Creates `backend/.venv` with all Python packages (including `uv`)
- ✅ Runs `npm install` for frontend
- ✅ Configures auto-activation

**Takes ~2-5 minutes depending on disk speed.**

## Step 2: Configure Environment

### Copy `.env` files from examples:

```powershell
# Backend
Copy-Item backend/.env.example backend/.env

# Frontend  
Copy-Item .env.example .env.local
```

### Edit both files and add your secrets:

**`backend/.env`:**
```
DATABASE_URL=postgresql://user:pass@neon.tech/healynx
GROQ_API_KEY=gsk_xxxxx...
JWT_SECRET_KEY=your-random-secret-here
```

**`.env.local` (frontend):**
```
DATABASE_URL=postgresql://user:pass@neon.tech/healynx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Step 3: Database Setup (First time only)

```powershell
# Push schema to Neon
npm run db:push

# Seed demo data
cd backend
python db/seed.py
cd ..
```

## Step 4: Start Servers

**Terminal 1 - Backend:**
```powershell
cd backend
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

Then open: **http://localhost:3000**

## Demo Login

```
Email: doctor@healynx.ai
Password: demo1234
```

## Troubleshooting

### `uv command not found`
Ensure `.venv` is activated:
```powershell
backend/.venv/Scripts/Activate.ps1
```

### `DATABASE_URL not set`
Add it to `backend/.env` (see Step 2)

### `npm: command not found`
Install Node.js from https://nodejs.org

### `python: command not found`
Install Python 3.11+ from https://python.org

### Low disk space?
```powershell
# Delete these safely if needed:
Remove-Item -Recurse node_modules
Remove-Item -Recurse backend/.venv
# Then re-run setup.ps1
```

## Key Commands

```powershell
# Backend
cd backend
uv run uvicorn main:app --reload --port 8000

# Frontend  
npm run dev

# Type checking (BiomeJS)
npm run check

# Build frontend
npm run build

# Seed database
cd backend && python db/seed.py
```

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind
- **Backend**: FastAPI + LangGraph + Groq LLM
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Package Manager**: `uv` (Python) + npm (Node)

## Need Help?

Check `.env.example` files for all available options.

---

**Ready?** Run `powershell -ExecutionPolicy Bypass -File setup.ps1` and you're good to go! 🚀
