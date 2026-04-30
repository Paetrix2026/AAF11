import json
from typing import List, Dict
from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.db import get_pool

logger = get_logger("PrecisionMedicineAgent")


async def fetch_patient_profile(patient_id: str) -> dict:
    """Fetch patient profile from the database."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT name, age, gender, conditions, medications FROM patients WHERE id = $1::uuid",
            patient_id
        )
        if row:
            return {
                "name": row["name"],
                "age": row["age"],
                "gender": row["gender"],
                "conditions": row["conditions"] or [],
                "medications": [m["name"] for m in (row["medications"] or [])],
            }
    return {}


async def run(state: PipelineState) -> PipelineState:
    """
    Filters drugs based on patient profile and identifies specific clinical risks.
    Outputs state["safe_drugs"].
    """
    state["step_updates"].append("PrecisionMedicineAgent:running:Cross-referencing with patient profile...")
    
    patient_id = state.get("patient_id")
    profile = state.get("patient_profile")
    
    if not profile and patient_id:
        try:
            profile = await fetch_patient_profile(patient_id)
            state["patient_profile"] = profile
        except Exception as e:
            logger.error(f"Failed to fetch patient profile: {e}")
            profile = {}

    docking_results = state.get("docking_results") or []
    if not docking_results:
        logger.warning("No docking results to filter")
        state["safe_drugs"] = []
        return state

    conditions = [c.lower() for c in (profile.get("conditions", []) if profile else [])]
    current_meds = [m.lower() for m in (profile.get("medications", []) if profile else [])]
    
    # Heuristic knowledge base for common clinical contraindications
    contraindications = {
        "cardiotoxic": ["arrhythmia", "heart failure", "hypertension"],
        "nephrotoxic": ["chronic kidney disease", "diabetes"],
        "hepatotoxic": ["liver cirrhosis", "hepatitis"],
    }
    
    safe_drugs = []
    for drug in docking_results:
        name = drug.get("name", "Unknown")
        smiles = drug.get("smiles", "")
        affinity = drug.get("affinity", 0.0)
        
        # Determine risks based on hypothetical side-effects (simplified for hackathon)
        side_effects = []
        if "N1" in smiles: side_effects.append("nephrotoxic")
        if "O=" in smiles: side_effects.append("cardiotoxic")
        
        is_safe = True
        risk_score = 0.1 # Baseline
        reasons = []

        for effect in side_effects:
            related_conditions = contraindications.get(effect, [])
            for cond in conditions:
                if any(rc in cond for rc in related_conditions):
                    is_safe = False
                    reasons.append(f"Contraindicated for {cond}")
        
        # Interaction check
        for med in current_meds:
            if med in name.lower():
                risk_score += 0.5
                reasons.append(f"Potential interaction with {med}")

        if not is_safe:
            risk_score = 1.0
            
        safe_drugs.append({
            "name": name,
            "smiles": smiles,
            "affinity": affinity,
            "patient_risk": round(min(1.0, risk_score), 2),
            "safety_notes": "; ".join(reasons) if reasons else "No patient-specific risks identified."
        })

    state["safe_drugs"] = safe_drugs
    state["step_updates"].append(f"PrecisionMedicineAgent:complete:Analyzed {len(safe_drugs)} compounds for patient safety")
    return state
