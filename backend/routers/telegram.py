from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from utils.db import get_pool
from auth.jwt import decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


class TelegramConnectRequest(BaseModel):
    handle: str


class FamilyAskRequest(BaseModel):
    question: str
    context: dict = {}


class FamilyNotifyRequest(BaseModel):
    patient_name: str
    primary_drug: str
    predicted_outcome: str = "unknown"
    time_to_failure: str = "N/A"
    risk_level: str = "unknown"
    patient_summary: str = ""
    action_required: str = ""
    pathogen: str = ""


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.post("/family/ask")
async def family_ask(req: FamilyAskRequest):
    from telegram.bot import answer_family_question
    answer = await answer_family_question(req.question, req.context)
    return {"success": True, "data": {"answer": answer}, "message": "OK"}


@router.post("/family/notify", response_model=APIResponse)
async def family_notify(req: FamilyNotifyRequest, current_user: dict = Depends(get_current_user)):
    from telegram.bot import send_family_channel_update
    sent = await send_family_channel_update(
        patient_name=req.patient_name,
        primary_drug=req.primary_drug,
        predicted_outcome=req.predicted_outcome,
        time_to_failure=req.time_to_failure,
        risk_level=req.risk_level,
        patient_summary=req.patient_summary,
        action_required=req.action_required,
        pathogen=req.pathogen,
    )
    return APIResponse(
        success=sent,
        data={"sent": sent},
        message="Family channel notified" if sent else "Notification failed",
    )


@router.post("/connect", response_model=APIResponse)
async def connect_telegram(req: TelegramConnectRequest, current_user: dict = Depends(get_current_user)):
    handle = req.handle.lstrip("@")
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET telegram_handle=$1, alert_opt_in=true WHERE id=$2::uuid",
            handle, current_user["sub"],
        )
    return APIResponse(success=True, data={"handle": handle}, message="Telegram connected")
