"""
Medications Routes — Prescription management and dose logging.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models.medication import Medication, MedicationLog, MedicationStatus
from app.db.models.doctor import Doctor
from app.db.models.user import User
from app.api.deps import require_doctor, require_patient, get_current_user

router = APIRouter()

class MedicationCreate(BaseModel):
    patient_id: str
    diagnosis_id: Optional[str] = None
    name: str
    dosage: str
    frequency: str
    route: str = "oral"
    schedule_times: List[str] = []
    instructions: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None

class MedicationLogUpdate(BaseModel):
    is_taken: bool
    patient_note: Optional[str] = None

@router.post("/", status_code=201)
async def prescribe_medication(
    data: MedicationCreate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db)
):
    """Doctor prescribes a medication."""
    doc_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    med = Medication(
        **data.model_dump(),
        doctor_id=doctor.id,
        status=MedicationStatus.active
    )
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return med

@router.get("/patient/{patient_id}")
async def get_patient_medications(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get active medications for a patient."""
    result = await db.execute(
        select(Medication)
        .where(Medication.patient_id == patient_id, Medication.status == MedicationStatus.active)
    )
    return result.scalars().all()

@router.post("/{medication_id}/log")
async def log_dose(
    medication_id: str,
    data: MedicationLogUpdate,
    current_user: User = Depends(require_patient),
    db: AsyncSession = Depends(get_db)
):
    """Patient logs if they took a dose."""
    log = MedicationLog(
        medication_id=medication_id,
        patient_id=current_user.id, # Needs patient profile ID mapping usually
        scheduled_at=datetime.utcnow(),
        taken_at=datetime.utcnow() if data.is_taken else None,
        is_taken=data.is_taken,
        is_missed=not data.is_taken,
        patient_note=data.patient_note
    )
    db.add(log)
    await db.commit()
    return {"message": "Dose logged successfully"}
