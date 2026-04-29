from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from utils.db import get_pool
from auth.jwt import decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


class TelegramConnectRequest(BaseModel):
    handle: str


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
