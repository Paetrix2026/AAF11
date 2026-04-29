"""
Shared FastAPI dependencies — authentication, DB session, role guards.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models.user import User, UserRole
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
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

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Doctor access required")
    return current_user


async def require_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.patient:
        raise HTTPException(status_code=403, detail="Patient access required")
    return current_user
