"""
Auth Routes — Register, Login, Profile (Neon Raw SQL Version)
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import asyncpg
import uuid

from app.db.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.api.deps import get_current_user
from pydantic import BaseModel, EmailStr
from typing import Optional, List

router = APIRouter()

class UserRole(str):
    doctor = "doctor"
    patient = "patient"

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str # 'doctor' or 'patient'

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    telegram_handle: Optional[str] = None

@router.post("/register", response_model=UserOut, status_code=201)
async def register(request: RegisterRequest, conn: asyncpg.Connection = Depends(get_db)):
    """Register a new user using raw SQL against Neon."""
    # Check if user exists
    existing = await conn.fetchrow("SELECT id FROM users WHERE email = $1", request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_pw = get_password_hash(request.password)
    
    await conn.execute(
        """
        INSERT INTO users (id, email, password_hash, name, role)
        VALUES ($1, $2, $3, $4, $5)
        """,
        user_id, request.email, hashed_pw, request.name, request.role
    )
    
    return {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "role": request.role
    }

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    conn: asyncpg.Connection = Depends(get_db),
):
    """Login with raw SQL against Neon."""
    user = await conn.fetchrow(
        "SELECT id, email, password_hash, role, name FROM users WHERE email = $1", 
        form_data.username
    )

    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": user['email'], "role": user['role']},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user['role'],
        "user_id": str(user['id']),
        "name": user['name']
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    # current_user is now likely a dict or Record from the new deps
    return current_user
