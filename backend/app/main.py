"""
Healynx Backend - FastAPI Application
Smart Healthcare Platform for Doctor-Patient Connected Care
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import init_db
from app.api.routes import (
    auth, doctors, patients, diagnoses,
    medications, recovery, reports, calendar,
    notifications, ai_assist, admin, sos, chatbot
)
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Healynx API",
    description="Smart Healthcare Platform — Doctor-Patient Connected Care",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth.router,          prefix="/api/v1/auth",          tags=["Auth"])
app.include_router(doctors.router,       prefix="/api/v1/doctors",       tags=["Doctors"])
app.include_router(patients.router,      prefix="/api/v1/patients",      tags=["Patients"])
app.include_router(diagnoses.router,     prefix="/api/v1/diagnoses",     tags=["Diagnoses"])
app.include_router(medications.router,   prefix="/api/v1/medications",   tags=["Medications"])
app.include_router(recovery.router,      prefix="/api/v1/recovery",      tags=["Recovery"])
app.include_router(reports.router,       prefix="/api/v1/reports",       tags=["Reports"])
app.include_router(calendar.router,      prefix="/api/v1/calendar",      tags=["Calendar"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(ai_assist.router,     prefix="/api/v1/ai",            tags=["AI Assist"])
app.include_router(admin.router,         prefix="/api/v1/admin",         tags=["Admin"])
app.include_router(sos.router,           prefix="/api/v1/sos",           tags=["SOS"])
app.include_router(chatbot.router,       prefix="/api/v1/chat",          tags=["Chatbot"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Healynx API"}
