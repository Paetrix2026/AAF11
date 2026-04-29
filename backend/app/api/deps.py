"""
Shared FastAPI dependencies — authentication, Neon Raw SQL Version.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import asyncpg
from app.db.database import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    conn: asyncpg.Connection = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if not email:
        raise credentials_exception

    # Use raw SQL to fetch user from users table
    user = await conn.fetchrow(
        "SELECT id, email, name, role FROM users WHERE email = $1", 
        email
    )
    
    if user is None:
        raise credentials_exception
    
    # Return as dict-like object (asyncpg.Record)
    return user

async def require_doctor(current_user = Depends(get_current_user)):
    if current_user['role'] != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required")
    return current_user

async def require_patient(current_user = Depends(get_current_user)):
    if current_user['role'] != "patient":
        raise HTTPException(status_code=403, detail="Patient access required")
    return current_user
