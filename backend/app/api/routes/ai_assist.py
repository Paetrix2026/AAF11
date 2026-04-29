from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from app.services import gemini
from pydantic import BaseModel

router = APIRouter()

class TreatmentRequest(BaseModel):
    disease_name: str
    stage: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    current_medications: List[str] = []
    allergies: List[str] = []
    chronic_conditions: List[str] = []

@router.post("/recommendations")
async def get_treatment_recommendations(request: TreatmentRequest):
    """Get AI-generated treatment recommendations."""
    try:
        return await gemini.get_treatment_recommendations(
            disease_name=request.disease_name,
            stage=request.stage,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender,
            current_medications=request.current_medications,
            allergies=request.allergies,
            chronic_conditions=request.chronic_conditions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diseases")
async def list_diseases():
    """Get a dynamic list of diseases for the dropdown."""
    try:
        return await gemini.get_disease_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tests/{disease_name}")
async def get_common_tests(disease_name: str):
    """Get common diagnostic tests for a specific disease."""
    try:
        return await gemini.get_common_tests_for_disease(disease_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
