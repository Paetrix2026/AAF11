from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models.sos import SOSRequest, SOSStatus
from app.api.schemas import SOSCreate, SOSResponse
from sqlalchemy import select
from typing import List

router = APIRouter()

@router.post("/", response_model=SOSResponse)
async def create_sos(sos: SOSCreate, db: AsyncSession = Depends(get_db)):
    """Create a new SOS emergency request."""
    db_sos = SOSRequest(**sos.model_dump())
    db.add(db_sos)
    await db.commit()
    await db.refresh(db_sos)
    return db_sos

@router.get("/active", response_model=List[SOSResponse])
async def get_active_sos(db: AsyncSession = Depends(get_db)):
    """Get all active SOS requests (for doctors/admin)."""
    result = await db.execute(select(SOSRequest).where(SOSRequest.status == SOSStatus.active))
    return result.scalars().all()

@router.patch("/{sos_id}/resolve")
async def resolve_sos(sos_id: str, db: AsyncSession = Depends(get_db)):
    """Mark an SOS request as resolved."""
    result = await db.execute(select(SOSRequest).where(SOSRequest.id == sos_id))
    db_sos = result.scalar_one_or_none()
    if not db_sos:
        raise HTTPException(status_code=404, detail="SOS not found")
    
    db_sos.status = SOSStatus.resolved
    await db.commit()
    return {"message": "SOS resolved"}
