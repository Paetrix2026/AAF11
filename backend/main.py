import os
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

if not os.getenv("DATABASE_URL"):
    print("WARNING: DATABASE_URL not set. Set it in backend/.env")

# LangSmith tracing
if os.getenv("LANGCHAIN_API_KEY"):
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "healynx")

# Suppress optional ML warnings
warnings.filterwarnings("ignore", message=".*PyTorch.*")
warnings.filterwarnings("ignore", message=".*TensorFlow.*")
warnings.filterwarnings("ignore", message=".*JAX.*")
warnings.filterwarnings("ignore", message=".*requires PyTorch.*")

from utils.db import init_db
from utils.health_check import print_health_report
from routers import (
    analysis,
    stream,
    status,
    molecules,
    search,
    export,
    benchmark,
    discoveries,
    themes,
    docked_poses,
    structure,
    auth,
    patients,
    alerts,
    telegram,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print_health_report()
    await init_db()
    yield


app = FastAPI(title="Healynx", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(analysis.router, prefix="/api")
app.include_router(stream.router, prefix="/api")
app.include_router(status.router, prefix="/api")
app.include_router(molecules.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(benchmark.router, prefix="/api")
app.include_router(discoveries.router, prefix="/api")
app.include_router(themes.router, prefix="/api")
app.include_router(docked_poses.router, prefix="/api")
app.include_router(structure.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(patients.router, prefix="/api/patients")
app.include_router(alerts.router, prefix="/api/alerts")
app.include_router(telegram.router, prefix="/api/telegram")


@app.get("/")
async def root():
    return {"status": "ok", "service": "Healynx Backend", "version": "1.0.0"}
