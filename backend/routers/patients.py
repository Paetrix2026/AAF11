import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from utils.db import get_pool
from auth.jwt import decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    conditions: Optional[List[str]] = []
    medications: Optional[List[dict]] = []
    status: Optional[str] = "active"


def _serialize_patient(row: dict) -> dict:
    p = dict(row)
    p["id"] = str(p["id"])
    p["doctorId"] = str(p.pop("doctor_id"))
    p["userId"] = str(p.pop("user_id")) if p.get("user_id") else None
    if p.get("created_at"):
        p["createdAt"] = p.pop("created_at").isoformat()
    return p


@router.get("", response_model=APIResponse)
async def list_patients(current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        if current_user.get("role") == "doctor":
            rows = await conn.fetch(
                "SELECT * FROM patients WHERE doctor_id = $1::uuid ORDER BY created_at DESC",
                current_user["sub"],
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM patients WHERE user_id = $1::uuid",
                current_user["sub"],
            )

    return APIResponse(success=True, data=[_serialize_patient(dict(r)) for r in rows], message="OK")


@router.get("/{patient_id}", response_model=APIResponse)
async def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM patients WHERE id = $1::uuid",
            patient_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail="Patient not found")

    return APIResponse(success=True, data=_serialize_patient(dict(row)), message="OK")


@router.post("", response_model=APIResponse)
async def create_patient(data: PatientCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create patients")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO patients (doctor_id, name, age, gender, location, conditions, medications, status)
            VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
            RETURNING *
            """,
            current_user["sub"],
            data.name,
            data.age,
            data.gender,
            data.location,
            json.dumps(data.conditions or []),
            json.dumps(data.medications or []),
            data.status or "active",
        )

    return APIResponse(success=True, data=_serialize_patient(dict(row)), message="Patient created")


@router.put("/{patient_id}", response_model=APIResponse)
async def update_patient(patient_id: str, data: PatientCreate, current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE patients
            SET name=$1, age=$2, gender=$3, location=$4,
                conditions=$5::jsonb, medications=$6::jsonb, status=$7
            WHERE id=$8::uuid AND doctor_id=$9::uuid
            RETURNING *
            """,
            data.name, data.age, data.gender, data.location,
            json.dumps(data.conditions or []),
            json.dumps(data.medications or []),
            data.status or "active",
            patient_id,
            current_user["sub"],
        )

    if not row:
        raise HTTPException(status_code=404, detail="Patient not found or not authorized")

    return APIResponse(success=True, data=_serialize_patient(dict(row)), message="Patient updated")
