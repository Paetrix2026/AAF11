from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pipeline.runner import run_healynx_pipeline

router = APIRouter()

class PatientProfile(BaseModel):
    heart_condition: bool
    diabetes: bool
    medications: List[str]

class AnalysisRequest(BaseModel):
    mutation: str
    patient_profile: PatientProfile

class Recommendation(BaseModel):
    drug: str
    risk: str
    urgency: str
    decision: str

class AnalysisResponse(BaseModel):
    recommendations: List[Recommendation]
    error: Optional[str] = None
    message: Optional[str] = None

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_pathogen(request: AnalysisRequest):
    """
    Unified endpoint to run the Healynx analysis pipeline.
    """
    try:
        input_data = request.dict()
        result = run_healynx_pipeline(input_data)
        
        if "error" in result:
            return AnalysisResponse(
                recommendations=[],
                error=result["error"],
                message=result["message"]
            )
            
        return AnalysisResponse(
            recommendations=result.get("recommendations", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
