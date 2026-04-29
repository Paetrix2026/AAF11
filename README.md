# 🧬 Healynx — Next-Gen Antiviral AI Pipeline

Healynx is a powerful, multi-agent orchestrator designed to accelerate antiviral discovery and pathogen analysis. By integrating genetic sequence retrieval, molecular docking, and AI-driven explainability, Healynx provides clinicians and researchers with rapid, data-backed recommendations for emerging viral threats.

---

## 🚀 Key Features

- **Multi-Agent Pipeline**: Orchestrates 10+ specialized agents using **LangGraph**.
- **Genetic Analysis**: Automated sequence retrieval from **NCBI Entrez** and mutation parsing via **MAFFT**.
- **Molecular Docking**: High-throughput screening against known antivirals using **AutoDock Vina**.
- **ADMET Prediction**: Real-time property prediction (toxicity, absorption, etc.) using **RDKit**.
- **Explainable AI**: Synthesis of complex scientific data into human-readable recommendations using **Groq (Llama 3.3)**.
- **Modern Dashboard**: High-performance UI built with **Next.js 15**, **Framer Motion**, and **GSAP** for a premium experience.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, Tailwind CSS 4, Framer Motion, GSAP, Plotly.js |
| **Backend** | FastAPI, LangGraph, Python 3.11 |
| **Database** | Neon (Postgres), Drizzle ORM |
| **Scientific** | RDKit, AutoDock Vina, MAFFT, OpenBabel |
| **AI/LLM** | Groq (Llama 3.3 70B), NCBI Entrez API |

---

## 📦 Quick Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- System Binaries (optional for full pipeline): `vina`, `obabel`, `mafft`

### One-Command Installation
We provide automated setup scripts for Windows and Linux/macOS that handle virtual environments, dependencies, and shell configuration.

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

**Linux / macOS (Bash):**
```bash
chmod +x setup.sh && ./setup.sh
```

---

## 🚦 Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env.local` (frontend) and `backend/.env` (backend).
- `DATABASE_URL`: Your Neon Postgres connection string.
- `GROQ_API_KEY`: For the Explainability Agent.
- `NCBI_EMAIL`: For the Fetch Agent.

### 2. Database Initialization
```bash
npm run db:push
# Then seed the data
cd backend && python db/seed.py
```

### 3. Start Development Servers
**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
npm run dev
```

---

## 🧠 Agent Architecture

Healynx uses a linear pipeline (with conditional logic) to process pathogens:

1.  **Planner**: Determines the necessary steps.
2.  **Fetch**: Retrieves sequences from NCBI.
3.  **Mutation Parser**: Aligns and scores mutations.
4.  **Structure Prep**: Prepares PDB files for docking.
5.  **Docking**: Performs Vina screening.
6.  **ADMET**: Predicts pharmacokinetics.
7.  **Resistance/Selectivity**: Checks for known resistance markers and off-targets.
8.  **Explainability**: Synthesizes results into a clinical recommendation.

For more details, see [AGENTS.md](./AGENTS.md).

---

## 📄 License
Healynx is proprietary software. All rights reserved.
