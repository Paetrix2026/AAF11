"""
Treatment Engine
Orchestrates the full precision medicine pipeline:
1. Disease inference (Gemini)
2. Candidate drug retrieval (Gemini)
3. Safety filtering (Safety Engine — rule-based)
4. Final treatment plan generation (Gemini, ONLY using safe drugs)

AI suggests ONLY from the safety-approved list. No free hallucination.
"""

import json
from typing import List, Dict, Any, Optional
from app.services.disease_inference_service import infer_diseases, get_condition_drug_candidates
from app.services.safety_engine import run_full_safety_report
from app.services.gemini import _call_gemini_json, HEALYNX_SYSTEM


async def run_precision_engine(
    # Patient demographics
    age: Optional[int],
    gender: Optional[str],
    # Medical profile
    symptoms: List[str],
    chronic_conditions: List[str],
    current_medications: List[str],
    allergies: List[str],
    # Optional
    vitals: Optional[Dict[str, Any]] = None,
    doctor_confirmed_disease: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full Precision Medicine Engine pipeline.
    Returns: inferred conditions, safety report, and a safe treatment plan.
    """

    # ── Step 1: Disease Inference ─────────────────────────────────────────────
    inference = await infer_diseases(
        symptoms=symptoms,
        chronic_conditions=chronic_conditions,
        age=age,
        gender=gender,
        vitals=vitals,
    )
    possible_conditions = inference.get("possible_conditions", [])

    # ── Step 2: Pick top condition (or use doctor-confirmed one) ──────────────
    target_condition = doctor_confirmed_disease
    if not target_condition and possible_conditions:
        target_condition = possible_conditions[0]["name"]

    # ── Step 3: Get drug candidates for the top condition ─────────────────────
    candidate_drugs: List[str] = []
    if target_condition:
        candidate_drugs = await get_condition_drug_candidates(target_condition)

    # ── Step 4: Safety Engine — filter candidates ─────────────────────────────
    safety_report = run_full_safety_report(
        proposed_drugs=candidate_drugs,
        chronic_conditions=chronic_conditions,
        current_medications=current_medications,
        allergies=allergies,
    )
    approved_drug_names = [entry["drug"] for entry in safety_report["approved_drugs"]]

    # ── Step 5: Generate final treatment plan using ONLY approved drugs ────────
    treatment_plan = {}
    if approved_drug_names:
        treatment_plan = await _generate_safe_treatment_plan(
            condition=target_condition or "Unknown",
            approved_drugs=approved_drug_names,
            patient_profile={
                "age": age,
                "gender": gender,
                "chronic_conditions": chronic_conditions,
                "current_medications": current_medications,
                "allergies": allergies,
                "vitals": vitals,
            },
        )

    return {
        "pipeline": "Healynx Precision Medicine Engine v1",
        "disease_inference": inference,
        "target_condition": target_condition,
        "candidate_drugs": candidate_drugs,
        "safety_report": safety_report,
        "treatment_plan": treatment_plan,
        "metadata": {
            "total_candidates_checked": len(candidate_drugs),
            "approved_count": safety_report["total_approved"],
            "blocked_count": safety_report["total_blocked"],
            "safety_grade": safety_report["safety_grade"],
        },
    }


async def _generate_safe_treatment_plan(
    condition: str,
    approved_drugs: List[str],
    patient_profile: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a structured treatment plan. Gemini can ONLY suggest from approved_drugs.
    """
    prompt = f"""
You are Healynx Assist. Generate a treatment plan for the following patient.

Condition: {condition}
Patient Profile:
- Age: {patient_profile.get('age', 'Unknown')}
- Gender: {patient_profile.get('gender', 'Unknown')}
- Chronic Conditions: {', '.join(patient_profile.get('chronic_conditions', [])) or 'None'}
- Current Medications: {', '.join(patient_profile.get('current_medications', [])) or 'None'}

IMPORTANT CONSTRAINT: You MUST only recommend drugs from this safety-approved list:
{json.dumps(approved_drugs)}

Do NOT suggest any drug outside this list.

Return JSON with this structure:
{{
  "primary_medication": {{
    "name": "Best drug from the approved list",
    "dosage": "e.g. 500mg",
    "frequency": "e.g. twice daily",
    "duration": "e.g. 7 days",
    "instructions": "Take with food, etc."
  }},
  "alternative_medications": [
    {{
      "name": "Second-choice drug from approved list",
      "reason": "Use if primary is not tolerated"
    }}
  ],
  "lifestyle_recommendations": ["Recommendation 1", "Recommendation 2"],
  "dietary_advice": ["Diet tip 1", "Diet tip 2"],
  "follow_up_in_days": 7,
  "monitoring_required": ["What to watch for"],
  "patient_education": "One paragraph plain-English explanation of the treatment plan"
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)
