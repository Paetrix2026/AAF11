"""
Diagnoses Routes — Healynx Precision Medicine Engine Integration
Handles condition inference, safety-filtered treatment plans, and diagnosis lifecycle.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models.diagnosis import Diagnosis, DiagnosisStatus
from app.db.models.patient import Patient
from app.db.models.doctor import Doctor
from app.db.models.user import User
from app.api.deps import require_doctor, get_current_user
from app.services.treatment_engine import run_precision_engine

router = APIRouter()

class DiagnosisCreate(BaseModel):
    patient_id: str
    disease_name: str
    disease_category: Optional[str] = None
    icd_code: Optional[str] = None
    stage: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    doctor_notes: Optional[str] = None
    tests_ordered: List[Dict[str, Any]] = []

class PrecisionEngineRequest(BaseModel):
    patient_id: str
    symptoms: List[str]
    doctor_confirmed_disease: Optional[str] = None

@router.post("/precision-engine", status_code=200)
async def run_engine(
    request: PrecisionEngineRequest,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db)
):
    """
    Run the Healynx Precision Medicine Engine for a patient.
    Infers conditions, runs safety checks, and generates a constrained treatment plan.
    """
    # Get patient profile
    pat_result = await db.execute(select(Patient).where(Patient.id == request.patient_id))
    patient = pat_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Run the engine
    try:
        result = await run_precision_engine(
            age=None, # Should compute from date_of_birth if available
            gender=patient.gender,
            symptoms=request.symptoms,
            chronic_conditions=patient.chronic_conditions or [],
            current_medications=[], # Should fetch from medications table
            allergies=patient.allergies or [],
            doctor_confirmed_disease=request.doctor_confirmed_disease
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=201)
async def create_diagnosis(
    data: DiagnosisCreate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Confirm a diagnosis and store it in the database."""
    # Find doctor profile
    doc_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    diagnosis = Diagnosis(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        disease_name=data.disease_name,
        disease_category=data.disease_category,
        icd_code=data.icd_code,
        stage=data.stage,
        clinic_name=data.clinic_name,
        clinic_address=data.clinic_address,
        doctor_notes=data.doctor_notes,
        tests_ordered=data.tests_ordered,
        status=DiagnosisStatus.active
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    return diagnosis

@router.get("/patient/{patient_id}")
async def get_patient_diagnoses(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all diagnoses for a specific patient."""
    result = await db.execute(select(Diagnosis).where(Diagnosis.patient_id == patient_id).order_by(Diagnosis.diagnosed_at.desc()))
    return result.scalars().all()
