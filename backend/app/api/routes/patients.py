"""
Patients Routes — Profile CRUD, Vitals, Symptom Check-In, My Doctors
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models.patient import Patient, DoctorPatient
from app.db.models.doctor import Doctor
from app.db.models.user import User
from app.db.models.recovery import SymptomCheckin, FeelStatus
from app.api.deps import require_patient, require_doctor, get_current_user

router = APIRouter()


class PatientProfileCreate(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = "Unknown"
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    emergency_contact: Optional[Dict[str, Any]] = None


class PatientProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    emergency_contact: Optional[Dict[str, Any]] = None


class SymptomCheckinCreate(BaseModel):
    feel_status: FeelStatus
    symptoms_present: List[str] = []
    symptom_severity: Optional[int] = None  # 1–10
    temperature_c: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    blood_glucose: Optional[float] = None
    patient_note: Optional[str] = None


# ── Create patient profile ────────────────────────────────────────────────────
@router.post("/profile", status_code=201)
async def create_patient_profile(
    data: PatientProfileCreate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Patient profile already exists")

    patient = Patient(**data.model_dump(), user_id=current_user.id)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


# ── Get own patient profile ───────────────────────────────────────────────────
@router.get("/profile/me")
async def get_my_patient_profile(
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient profile not found. Please complete registration.")
    return patient


# ── Update own patient profile ────────────────────────────────────────────────
@router.patch("/profile/me")
async def update_patient_profile(
    data: PatientProfileUpdate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient


# ── Get patient by ID (doctor access) ────────────────────────────────────────
@router.get("/{patient_id}")
async def get_patient_by_id(
    patient_id: str,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient


# ── Daily symptom check-in ────────────────────────────────────────────────────
@router.post("/checkin")
async def submit_symptom_checkin(
    data: SymptomCheckinCreate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    checkin = SymptomCheckin(**data.model_dump(), patient_id=patient.id, checkin_date=date.today())
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)
    return {"message": "Check-in submitted", "checkin_id": checkin.id, "date": str(date.today())}


# ── Get my check-in history ───────────────────────────────────────────────────
@router.get("/checkins/history")
async def get_my_checkins(
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    checkins_result = await db.execute(
        select(SymptomCheckin)
        .where(SymptomCheckin.patient_id == patient.id)
        .order_by(SymptomCheckin.checkin_date.desc())
    )
    return {"checkins": checkins_result.scalars().all()}


# ── Get my assigned doctors ───────────────────────────────────────────────────
@router.get("/my-doctors")
async def get_my_doctors(
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient profile not found")

    links = await db.execute(
        select(DoctorPatient).where(DoctorPatient.patient_id == patient.id)
    )
    doctors_out = []
    for link in links.scalars().all():
        doc = await db.execute(select(Doctor).where(Doctor.id == link.doctor_id))
        doctor = doc.scalar_one_or_none()
        if doctor:
            doctors_out.append({
                "doctor_id": doctor.id,
                "full_name": doctor.full_name,
                "specialization": doctor.specialization,
                "clinic_name": link.clinic_name,
                "status": link.status,
                "doctor_summary": link.doctor_summary,
                "improvement_suggestions": link.improvement_suggestions,
            })

    return {"doctors": doctors_out, "total": len(doctors_out)}
