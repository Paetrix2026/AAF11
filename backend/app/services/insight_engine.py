"""
Insight Engine — Evolving Disease & Treatment Resistance Detection
Tracks recovery over time and flags cases where standard treatment isn't working.
This is the "WOW" feature: adaptive treatment intelligence.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.services.gemini import _call_gemini_json, HEALYNX_SYSTEM


RESISTANCE_THRESHOLD_DAYS = 7       # Days before flagging non-improvement
DECLINING_SCORE_THRESHOLD = 5.0     # Score drop that triggers alert
CRITICAL_SCORE = 35.0               # Below this = urgent escalation


def compute_recovery_score(
    medication_adherence_pct: float,   # 0-100
    feel_status: str,                  # better / same / worse
    symptom_severity: Optional[int],   # 1-10
    vitals: Optional[Dict] = None,
) -> Dict[str, Any]:
    """
    Algorithm: Score = Adherence(40pts) + Symptoms(35pts) + Vitals(25pts)
    """
    # ── 1. Medication Adherence Score (0-40) ──────────────────────────────────
    adherence_score = (medication_adherence_pct / 100) * 40

    # ── 2. Symptom Score (0-35) ───────────────────────────────────────────────
    feel_map = {"better": 1.0, "same": 0.6, "worse": 0.2}
    feel_weight = feel_map.get(feel_status, 0.5)

    if symptom_severity is not None:
        severity_weight = (10 - symptom_severity) / 10  # Lower severity = better
        symptom_score = ((feel_weight + severity_weight) / 2) * 35
    else:
        symptom_score = feel_weight * 35

    # ── 3. Vitals Score (0-25) ────────────────────────────────────────────────
    vitals_score = _score_vitals(vitals) if vitals else 17.5  # Neutral if not provided

    total = round(adherence_score + symptom_score + vitals_score, 1)
    total = max(0.0, min(100.0, total))

    trend_color = "green" if total >= 70 else "yellow" if total >= 40 else "red"

    return {
        "score": total,
        "breakdown": {
            "medication_adherence": round(adherence_score, 1),
            "symptom": round(symptom_score, 1),
            "vitals": round(vitals_score, 1),
        },
        "color_status": trend_color,
        "requires_urgent_review": total < CRITICAL_SCORE,
    }


def _score_vitals(vitals: Dict) -> float:
    """Score vitals against normal ranges. Returns 0-25."""
    points = 25.0
    deductions = 0.0

    # Temperature (normal 36.1–37.2°C)
    temp = vitals.get("temperature_c")
    if temp is not None:
        if temp > 39.0 or temp < 35.0:
            deductions += 10
        elif temp > 38.0 or temp < 36.0:
            deductions += 5

    # Heart Rate (normal 60-100 bpm)
    hr = vitals.get("heart_rate")
    if hr is not None:
        if hr > 120 or hr < 45:
            deductions += 8
        elif hr > 100 or hr < 60:
            deductions += 3

    # SpO2 (normal ≥95%)
    spo2 = vitals.get("oxygen_saturation")
    if spo2 is not None:
        if spo2 < 90:
            deductions += 15
        elif spo2 < 95:
            deductions += 7

    # Blood Pressure (normal systolic 90-120)
    sys_bp = vitals.get("blood_pressure_systolic")
    if sys_bp is not None:
        if sys_bp > 180 or sys_bp < 80:
            deductions += 8
        elif sys_bp > 140 or sys_bp < 90:
            deductions += 4

    return max(0.0, points - deductions)


def detect_trend(scores: List[float]) -> str:
    """
    Determine recovery trend from a list of recent scores (oldest first).
    """
    if len(scores) < 2:
        return "stable"
    recent = scores[-3:] if len(scores) >= 3 else scores
    delta = recent[-1] - recent[0]
    if delta > 5:
        return "improving"
    elif delta < -5:
        return "declining"
    return "stable"


def detect_treatment_resistance(
    scores: List[float],
    trend: str,
    days_on_treatment: int,
    diagnosis_name: str,
) -> Dict[str, Any]:
    """
    Flag a case as potentially treatment-resistant.
    Triggers when: score not improving after N days of treatment.
    """
    if days_on_treatment < RESISTANCE_THRESHOLD_DAYS:
        return {"resistance_flagged": False, "reason": "Insufficient time on treatment"}

    avg_score = sum(scores) / len(scores) if scores else 0
    is_declining = trend == "declining"
    is_not_improving = trend in ("stable", "declining") and avg_score < 55

    if is_declining or is_not_improving:
        return {
            "resistance_flagged": True,
            "potential_research_case": True,
            "reason": (
                f"Patient has been on treatment for {days_on_treatment} days "
                f"with {trend} trend. Standard treatment for {diagnosis_name} "
                "may be less effective. Flagged for alternative therapeutic exploration."
            ),
            "recommendation": "Consider alternative drug class or specialist referral.",
            "flag_type": "treatment_resistance",
        }
    return {
        "resistance_flagged": False,
        "reason": f"Recovery progressing normally. Trend: {trend}. Avg score: {avg_score:.1f}",
    }


async def generate_adaptive_suggestion(
    patient_score: float,
    trend: str,
    diagnosis_name: str,
    current_medications: List[str],
    resistance_flagged: bool,
) -> Dict[str, Any]:
    """
    Ask Gemini for an adaptive follow-up suggestion based on recovery data.
    """
    prompt = f"""
Patient recovery analysis:
- Condition: {diagnosis_name}
- Recovery Score: {patient_score}/100
- Trend: {trend}
- Current Medications: {', '.join(current_medications) if current_medications else "None"}
- Treatment Resistance Flagged: {resistance_flagged}

Based on this recovery profile, provide adaptive clinical guidance.
Return JSON:
{{
  "summary": "One-sentence clinical assessment",
  "next_action": "continue|adjust|escalate|refer",
  "follow_up_in_days": <integer>,
  "patient_message": "Warm, plain-English message for the patient (max 2 sentences)",
  "doctor_alert": "Clinical note for doctor (or null if not needed)",
  "alternative_drug_classes": ["Only if resistance_flagged=true, else empty list"],
  "urgency": "routine|soon|urgent"
}}
"""
    return await _call_gemini_json(prompt, HEALYNX_SYSTEM)
