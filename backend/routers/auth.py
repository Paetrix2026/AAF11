from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from utils.db import get_pool
from auth.hashing import verify_password
from auth.jwt import create_access_token, decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


@router.post("/login", response_model=APIResponse)
async def login(req: LoginRequest):
    pool = await get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, email, password_hash, name, role FROM users WHERE email = $1",
            req.email,
        )

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user["role"] != req.role:
        raise HTTPException(status_code=401, detail=f"Account is not a {req.role} account")

    token = create_access_token(
        user_id=str(user["id"]),
        role=user["role"],
        name=user["name"],
        email=user["email"],
    )

    return APIResponse(
        success=True,
        data={
            "token": token,
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            },
        },
        message="Login successful",
    )


@router.get("/me", response_model=APIResponse)
async def me(current_user: dict = Depends(get_current_user)):
    # Fetch fresh user data from DB to include telegram handle etc.
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, name, role, telegram_handle, alert_opt_in FROM users WHERE id = $1::uuid",
            current_user["sub"],
        )
    if row:
        return APIResponse(
            success=True,
            data={
                "id": str(row["id"]),
                "email": row["email"],
                "name": row["name"],
                "role": row["role"],
                "telegramHandle": row["telegram_handle"],
                "alertOptIn": row["alert_opt_in"],
            },
            message="OK",
        )
    return APIResponse(success=True, data=current_user, message="OK")


@router.post("/logout", response_model=APIResponse)
async def logout():
    return APIResponse(success=True, data=None, message="Logged out")
