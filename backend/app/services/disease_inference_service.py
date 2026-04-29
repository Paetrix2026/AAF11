"""
Disease Inference Service
Uses Gemini to infer probable conditions from symptoms, history, and vitals.
Returns a ranked probability list — NOT a definitive diagnosis.
The doctor confirms; Gemini assists.
"""

import json
from typing import List, Dict, Any, Optional
from app.services.gemini import _call_gemini_json, HEALYNX_SYSTEM


async def infer_diseases(
    symptoms: List[str],
    chronic_conditions: List[str],
    age: Optional[int],
    gender: Optional[str],
    vitals: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Ask Gemini to infer probable conditions with confidence scores.
    Returns a ranked list — does NOT finalize a diagnosis.
    """
    vitals_str = json.dumps(vitals) if vitals else "Not provided"

    prompt = f"""
You are a clinical decision support system. Based on the following patient data, infer possible medical conditions.

Patient Profile:
- Age: {age or "Unknown"}
- Gender: {gender or "Unknown"}
- Reported Symptoms: {', '.join(symptoms) if symptoms else "None"}
- Known Chronic Conditions: {', '.join(chronic_conditions) if chronic_conditions else "None"}
- Vitals: {vitals_str}

Return a JSON object with this EXACT structure:
{{
  "possible_conditions": [
    {{
      "name": "Condition name",
      "icd_code": "ICD-10 code",
      "confidence": 0.85,
      "key_indicators": ["symptom or factor that supports this"],
      "urgency": "routine|moderate|urgent|emergency"
    }}
  ],
  "disclaimer": "These are probability estimates for clinical decision support. The attending physician must confirm the diagnosis.",
  "recommended_specialist": "Specialist type if referral is needed",
  "immediate_concerns": ["Any red flags requiring immediate attention"]
}}

- List conditions ranked by confidence (highest first).
- Include 2-5 conditions.
- Confidence must be a float between 0.0 and 1.0.
- Be conservative. Do not overstate confidence.
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def get_condition_drug_candidates(
    condition_name: str,
    severity: Optional[str] = None,
) -> List[str]:
    """
    Ask Gemini to suggest drug candidates for a given condition.
    These are CANDIDATES — they will be filtered by the Safety Engine before use.
    """
    prompt = f"""
For the medical condition: {condition_name}
Severity/Stage: {severity or "Not specified"}

List the standard first-line and second-line drug treatments.
Return ONLY a JSON array of drug names (generic names only):
["Drug1", "Drug2", "Drug3", ...]

Include 5-10 drugs. Use generic (INN) names only. No explanations.
"""
    result = await _call_gemini_json(prompt, HEALYNX_SYSTEM)
    # Gemini may return a list or a dict with a list
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        for v in result.values():
            if isinstance(v, list):
                return v
    return []
