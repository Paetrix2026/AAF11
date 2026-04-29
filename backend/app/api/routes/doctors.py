"""
Doctors Routes — Profile CRUD, Patient Assignment, Clinic Management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models.doctor import Doctor
from app.db.models.patient import Patient, DoctorPatient
from app.db.models.user import User
from app.api.deps import get_current_user, require_doctor

router = APIRouter()


class ClinicInfo(BaseModel):
    name: str
    address: str
    city: str
    phone: Optional[str] = None


class DoctorProfileCreate(BaseModel):
    full_name: str
    specialization: str
    registration_number: str
    phone: Optional[str] = None
    clinics: List[ClinicInfo] = []


class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None
    clinics: Optional[List[ClinicInfo]] = None


class AssignPatientRequest(BaseModel):
    patient_user_id: str
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None


# ── Create doctor profile (after registration) ────────────────────────────────
@router.post("/profile", status_code=201)
async def create_doctor_profile(
    data: DoctorProfileCreate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Doctor profile already exists")

    doctor = Doctor(
        user_id=current_user.id,
        full_name=data.full_name,
        specialization=data.specialization,
        registration_number=data.registration_number,
        phone=data.phone,
        clinics=[c.model_dump() for c in data.clinics],
    )
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


# ── Get own doctor profile ────────────────────────────────────────────────────
@router.get("/profile/me")
async def get_my_doctor_profile(
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found. Please create one.")
    return doctor


# ── Update own doctor profile ─────────────────────────────────────────────────
@router.patch("/profile/me")
async def update_doctor_profile(
    data: DoctorProfileUpdate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    for field, value in data.model_dump(exclude_none=True).items():
        if field == "clinics" and value is not None:
            setattr(doctor, field, [c if isinstance(c, dict) else c.model_dump() for c in value])
        else:
            setattr(doctor, field, value)

    await db.commit()
    await db.refresh(doctor)
    return doctor


# ── Assign a patient to this doctor ──────────────────────────────────────────
@router.post("/patients/assign")
async def assign_patient(
    data: AssignPatientRequest,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    # Find doctor profile
    doc_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    # Find patient profile by user_id
    pat_result = await db.execute(select(Patient).where(Patient.user_id == data.patient_user_id))
    patient = pat_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(404, "Patient not found")

    # Check not already assigned
    existing = await db.execute(
        select(DoctorPatient).where(
            DoctorPatient.doctor_id == doctor.id,
            DoctorPatient.patient_id == patient.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Patient already assigned to this doctor")

    link = DoctorPatient(
        doctor_id=doctor.id,
        patient_id=patient.id,
        clinic_name=data.clinic_name,
        clinic_address=data.clinic_address,
    )
    db.add(link)
    await db.commit()
    return {"message": "Patient successfully assigned", "patient_id": patient.id}


# ── Get all patients assigned to this doctor ──────────────────────────────────
@router.get("/patients")
async def get_my_patients(
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doc_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    links_result = await db.execute(
        select(DoctorPatient).where(DoctorPatient.doctor_id == doctor.id)
    )
    links = links_result.scalars().all()

    patients_out = []
    for link in links:
        pat_result = await db.execute(select(Patient).where(Patient.id == link.patient_id))
        patient = pat_result.scalar_one_or_none()
        if patient:
            patients_out.append({
                "patient_id": patient.id,
                "full_name": patient.full_name,
                "blood_group": patient.blood_group,
                "phone": patient.phone,
                "clinic_name": link.clinic_name,
                "status": link.status,
                "assigned_at": link.assigned_at,
            })

    return {"patients": patients_out, "total": len(patients_out)}


# ── Update doctor-patient relationship notes ──────────────────────────────────
class DoctorPatientNotes(BaseModel):
    doctor_summary: Optional[str] = None
    improvement_suggestions: Optional[List[str]] = None
    status: Optional[str] = None


@router.patch("/patients/{patient_id}/notes")
async def update_patient_notes(
    patient_id: str,
    data: DoctorPatientNotes,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doc_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    link_result = await db.execute(
        select(DoctorPatient).where(
            DoctorPatient.doctor_id == doctor.id,
            DoctorPatient.patient_id == patient_id,
        )
    )
    link = link_result.scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Patient not assigned to this doctor")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(link, field, value)

    await db.commit()
    return {"message": "Notes updated"}
