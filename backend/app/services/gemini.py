import json
import httpx
from typing import Optional, List, Dict, Any
from app.core.config import settings


GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"


async def _call_gemini(prompt: str, system_prompt: str = "") -> str:
    """
    Low-level Gemini call. Returns raw text response.
    """
    headers = {"Content-Type": "application/json"}
    params = {"key": settings.GEMINI_API_KEY}

    parts = []
    if system_prompt:
        parts.append({"text": f"[SYSTEM CONTEXT]\n{system_prompt}\n\n[USER REQUEST]\n{prompt}"})
    else:
        parts.append({"text": prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.3,
            "topK": 32,
            "topP": 0.9,
            "maxOutputTokens": 2048,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_MEDICAL", "threshold": "BLOCK_ONLY_HIGH"},
        ]
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(GEMINI_URL, json=payload, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_gemini_json(prompt: str, system_prompt: str = "") -> Dict:
    """Call Gemini and parse JSON response."""
    full_prompt = f"{prompt}\n\nRespond ONLY with valid JSON. No markdown, no explanation, no backticks."
    raw = await _call_gemini(full_prompt, system_prompt)
    # Strip any accidental markdown fences
    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    return json.loads(raw)


HEALYNX_SYSTEM = """
You are Healynx Assist, a clinical decision support AI embedded in the Healynx healthcare platform.
You provide evidence-based guidance to help doctors make better treatment decisions.
You are NOT a replacement for a doctor — you are an intelligent assistant.
Always be accurate, responsible, and evidence-informed.
For patient-facing content: be warm, hopeful, clear, and non-alarming while remaining truthful.
All recommendations are reference-based suggestions that the attending doctor must review and approve.
"""


async def get_treatment_recommendations(
    disease_name: str,
    stage: Optional[str],
    patient_age: Optional[int],
    patient_gender: Optional[str],
    current_medications: List[str],
    allergies: List[str],
    chronic_conditions: List[str],
    additional_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Healynx Assist — core feature.
    Returns structured treatment recommendations for a given disease.
    """
    prompt = f"""
Disease: {disease_name}
Stage: {stage or "Not specified"}
Patient Age: {patient_age or "Unknown"}
Patient Gender: {patient_gender or "Unknown"}
Current Medications: {', '.join(current_medications) if current_medications else "None"}
Allergies: {', '.join(allergies) if allergies else "None"}
Chronic Conditions: {', '.join(chronic_conditions) if chronic_conditions else "None"}
Additional Context: {additional_context or "None"}

Generate a structured clinical treatment recommendation.

Return JSON with this exact structure:
{{
  "disease_summary": "Brief description of the disease and this stage",
  "severity_level": "mild|moderate|severe|critical",
  "medications": [
    {{
      "name": "Drug name",
      "category": "Drug class",
      "dosage_range": "e.g. 500mg-1000mg",
      "frequency": "e.g. twice daily",
      "route": "oral|IV|topical|inhaled",
      "duration": "e.g. 7-10 days",
      "notes": "Take with food, monitor liver enzymes, etc.",
      "contraindicated": false
    }}
  ],
  "first_line_treatment": "Primary recommended medication name",
  "alternative_treatments": ["Alt 1", "Alt 2"],
  "recommended_tests": [
    {{"test_name": "Test name", "purpose": "Why this test", "frequency": "once|weekly|monthly"}}
  ],
  "lifestyle_modifications": ["Modification 1", "Modification 2"],
  "recovery_timeline": "Expected recovery duration and milestones",
  "follow_up_in_days": 7,
  "red_flags": ["Symptom that needs immediate attention"],
  "precautions": ["Precaution 1"],
  "drug_interactions_check": ["Flag any interaction with current meds if found"]
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def generate_patient_explanation(
    disease_name: str,
    stage: Optional[str],
    doctor_notes: Optional[str],
    test_results: List[Dict],
    medications: List[str],
    patient_name: str
) -> str:
    """
    Generate a warm, clear, non-scary explanation of a diagnosis for the patient.
    Uses simple language. Ends with hope and encouragement.
    """
    prompt = f"""
Patient Name: {patient_name}
Diagnosis: {disease_name}
Stage: {stage or "Not specified"}
Doctor's Notes: {doctor_notes or "None"}
Tests Done: {json.dumps(test_results) if test_results else "None"}
Medications Prescribed: {', '.join(medications) if medications else "None"}

Write a warm, clear, and encouraging explanation of this diagnosis FOR THE PATIENT.
Rules:
- Use simple, everyday language (no medical jargon)
- Do NOT alarm or scare the patient
- Be truthful and genuine
- Explain what the diagnosis means, what the tests showed, and what treatment will do
- End with a message of hope and encouragement
- Maximum 300 words
- Write in second person ("You have...", "Your doctor has...")
"""
    return await _call_gemini(prompt, HEALYNX_SYSTEM)


async def generate_report_patient_version(
    report_content: str,
    patient_name: str,
    doctor_name: str
) -> str:
    """Convert a medical report into patient-friendly language."""
    prompt = f"""
Doctor: Dr. {doctor_name}
Patient: {patient_name}

Medical Report:
{report_content}

Rewrite this report for {patient_name} in simple, warm, encouraging language.
Rules:
- Replace all medical terms with plain English
- Keep the same factual information
- Be reassuring and positive where appropriate
- Format clearly with short paragraphs
- Maximum 400 words
"""
    return await _call_gemini(prompt, HEALYNX_SYSTEM)


async def analyze_recovery_and_missed_doses(
    missed_doses_today: int,
    consecutive_missed_days: int,
    feel_status: str,
    symptom_severity: Optional[int],
    recovery_score: float,
    disease_name: str,
    trend: str
) -> Dict[str, str]:
    """
    Missed Medication Intelligence.
    Returns alert message and action suggestion.
    """
    prompt = f"""
Patient's situation:
- Disease: {disease_name}
- Recovery Score: {recovery_score}/100
- Trend: {trend}
- Feel Status Today: {feel_status}
- Symptom Severity: {symptom_severity or "Not reported"}/10
- Missed Doses Today: {missed_doses_today}
- Consecutive Days with Missed Doses: {consecutive_missed_days}

Generate a response JSON:
{{
  "alert_message": "Patient-facing message about missed doses and what it means (warm, not scary, max 2 sentences)",
  "doctor_alert": "Doctor-facing flag if serious (or null if not needed)",
  "action_suggestion": "What patient should do now (max 1 sentence)",
  "escalate_to_doctor": true/false
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def predict_follow_up(
    disease_name: str,
    stage: Optional[str],
    recovery_score: float,
    trend: str,
    days_since_diagnosis: int
) -> Dict[str, Any]:
    """Follow-up predictor — when should the next check-up be?"""
    prompt = f"""
Disease: {disease_name}
Stage: {stage or "Not specified"}
Recovery Score: {recovery_score}/100
Recovery Trend: {trend}
Days Since Diagnosis: {days_since_diagnosis}

Based on this, predict:
{{
  "follow_up_in_days": <integer>,
  "follow_up_reason": "Why this timeframe",
  "urgency": "routine|soon|urgent",
  "suggested_tests_at_follow_up": ["test1", "test2"]
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def generate_diet_plan(
    disease_name: str,
    stage: Optional[str],
    allergies: List[str],
    chronic_conditions: List[str]
) -> List[Dict]:
    """Generate a disease-specific diet plan."""
    prompt = f"""
Disease: {disease_name}
Stage: {stage or "Not specified"}
Allergies: {', '.join(allergies) if allergies else "None"}
Other Conditions: {', '.join(chronic_conditions) if chronic_conditions else "None"}

Generate a practical, easy-to-follow diet plan.
Return JSON array:
[
  {{
    "meal": "Breakfast|Lunch|Dinner|Snack",
    "items": ["Item 1", "Item 2"],
    "notes": "Why this is helpful",
    "foods_to_avoid": ["Food to avoid"]
  }}
]
Include Breakfast, Lunch, Dinner, and Snack entries.
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def get_disease_list() -> List[Dict]:
    """
    Return a structured list of diseases grouped by category.
    Used for the doctor's disease dropdown — fully dynamic.
    """
    prompt = """
Return a comprehensive JSON list of common diseases grouped by medical category.
Format:
[
  {
    "category": "Cardiovascular",
    "diseases": [
      {"name": "Hypertension", "icd_code": "I10", "common_stages": ["Stage 1", "Stage 2", "Crisis"]},
      {"name": "Heart Failure", "icd_code": "I50", "common_stages": ["Stage A", "Stage B", "Stage C", "Stage D"]}
    ]
  }
]

Include at least 15 categories: Cardiovascular, Respiratory, Infectious, Endocrine, Neurological,
Gastrointestinal, Musculoskeletal, Renal, Hematological, Oncological, Dermatological,
Psychiatric, Autoimmune, Ophthalmological, ENT.
Include 5-8 diseases per category with accurate ICD codes.
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def get_common_tests_for_disease(disease_name: str) -> List[Dict]:
    """Return common diagnostic tests for a disease — feeds the test dropdown."""
    prompt = f"""
Disease: {disease_name}
Return JSON list of common diagnostic tests ordered for this disease:
[
  {{
    "test_name": "Complete Blood Count (CBC)",
    "abbreviation": "CBC",
    "purpose": "To check...",
    "test_type": "blood|urine|imaging|biopsy|culture|other",
    "reference_ranges": {{"parameter": "Normal range"}}
  }}
]
Return 5-10 relevant tests.
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)


async def analyze_symptom_checkin(
    feel_status: str,
    symptoms: List[str],
    severity: Optional[int],
    vitals: Dict,
    disease_name: str
) -> Dict:
    """Analyze a patient's symptom check-in in context of their disease."""
    prompt = f"""
Patient check-in:
- Disease: {disease_name}
- Feel Status: {feel_status}
- Symptoms: {', '.join(symptoms) if symptoms else "None reported"}
- Severity (1-10): {severity or "Not reported"}
- Vitals: {json.dumps(vitals)}

Assess this check-in:
{{
  "assessment": "Brief assessment of patient's current state",
  "concern_level": "low|medium|high",
  "immediate_action_needed": true/false,
  "patient_message": "Warm, encouraging message for the patient (1-2 sentences)",
  "doctor_note": "Clinical note for the doctor (or null)"
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)
