from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
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


def _serialize_alert(row: dict) -> dict:
    a = dict(row)
    a["id"] = str(a["id"])
    a["targetId"] = str(a.pop("target_id"))
    a["targetType"] = a.pop("target_type")
    a["alertType"] = a.pop("alert_type")
    if a.get("created_at"):
        a["createdAt"] = a.pop("created_at").isoformat()
    return a


@router.get("", response_model=APIResponse)
async def get_alerts(current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM alerts WHERE target_id = $1::uuid ORDER BY created_at DESC LIMIT 50",
            current_user["sub"],
        )

    alerts = [_serialize_alert(dict(row)) for row in rows]
    return APIResponse(success=True, data=alerts, message="OK")


@router.get("/patient/{patient_id}", response_model=APIResponse)
async def get_patient_alerts(patient_id: str, current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM alerts WHERE target_id = $1::uuid ORDER BY created_at DESC LIMIT 20",
            patient_id,
        )

    alerts = [_serialize_alert(dict(row)) for row in rows]
    return APIResponse(success=True, data=alerts, message="OK")


@router.post("/mark-read/{alert_id}", response_model=APIResponse)
async def mark_alert_read(alert_id: str, current_user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE alerts SET read = true WHERE id = $1::uuid RETURNING *",
            alert_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")

    return APIResponse(success=True, data=_serialize_alert(dict(row)), message="Marked as read")
