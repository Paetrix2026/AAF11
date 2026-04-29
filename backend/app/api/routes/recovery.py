"""
Recovery Routes — Recovery score calculation and trend analysis.
Uses the Insight Engine to detect treatment resistance.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date

from app.db.database import get_db
from app.db.models.recovery import RecoveryScore, SymptomCheckin
from app.db.models.patient import Patient
from app.db.models.diagnosis import Diagnosis
from app.api.deps import get_current_user
from app.services.insight_engine import (
    compute_recovery_score, 
    detect_trend, 
    detect_treatment_resistance,
    generate_adaptive_suggestion
)

router = APIRouter()

@router.get("/score/{patient_id}")
async def get_latest_recovery_score(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetch the latest computed recovery score for a patient."""
    result = await db.execute(
        select(RecoveryScore)
        .where(RecoveryScore.patient_id == patient_id)
        .order_by(RecoveryScore.score_date.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if not score:
        return {"message": "No recovery score computed yet"}
    return score

@router.post("/compute/{patient_id}")
async def compute_patient_recovery(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Compute daily recovery score using Insight Engine.
    Checks for treatment resistance.
    """
    # 1. Fetch latest check-in
    checkin_result = await db.execute(
        select(SymptomCheckin)
        .where(SymptomCheckin.patient_id == patient_id)
        .order_by(SymptomCheckin.checked_in_at.desc())
        .limit(1)
    )
    checkin = checkin_result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(status_code=400, detail="No symptom check-in found for today")

    # 2. Compute Score
    # Simplified adherence for demo
    score_data = compute_recovery_score(
        medication_adherence_pct=100.0, 
        feel_status=checkin.feel_status,
        symptom_severity=checkin.symptom_severity,
        vitals={
            "temperature_c": checkin.temperature_c,
            "heart_rate": checkin.heart_rate,
            "oxygen_saturation": checkin.oxygen_saturation
        }
    )

    # 3. Detect Trend
    history_result = await db.execute(
        select(RecoveryScore.score)
        .where(RecoveryScore.patient_id == patient_id)
        .order_by(RecoveryScore.score_date.desc())
        .limit(7)
    )
    scores_history = history_result.scalars().all()[::-1] # chronological
    trend = detect_trend(scores_history + [score_data["score"]])

    # 4. Check for Resistance
    diag_result = await db.execute(select(Diagnosis).where(Diagnosis.patient_id == patient_id).limit(1))
    diagnosis = diag_result.scalar_one_or_none()
    
    resistance = detect_treatment_resistance(
        scores=scores_history + [score_data["score"]],
        trend=trend,
        days_on_treatment=len(scores_history) + 1,
        diagnosis_name=diagnosis.disease_name if diagnosis else "Unknown"
    )

    # 5. Save and Return
    db_score = RecoveryScore(
        patient_id=patient_id,
        score=score_data["score"],
        trend=trend,
        color_status=score_data["color_status"],
        follow_up_suggestion=resistance.get("recommendation"),
        score_date=date.today()
    )
    db.add(db_score)
    await db.commit()
    await db.refresh(db_score)

    return {
        "score": db_score,
        "insight": resistance
    }
