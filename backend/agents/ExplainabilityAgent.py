import json
from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.llm_router import get_llm

logger = get_logger("ExplainabilityAgent")

RECOMMENDATION_PROMPT = """You are a clinical AI assistant. Based on the pipeline analysis below, generate a treatment recommendation.

Pathogen: {pathogen}
Mutations detected: {mutations}
Top docked compounds: {docking_results}
ADMET scores: {admet_scores}
Resistance profile: {resistance_scores}
Selectivity scores: {selectivity_scores}
Similar historical cases: {similar_cases}

Return ONLY a valid JSON object with these exact fields:
{{
  "primary_drug": "name of recommended drug",
  "primary_confidence": 85,
  "primary_resistance_risk": "low",
  "alternative_drug": "backup option name",
  "alternative_confidence": 70,
  "urgency": "24_hours",
  "risk_level": "high",
  "doctor_summary": "2-3 sentence clinical summary for the doctor",
  "patient_summary": "1 sentence plain English for patient",
  "action_required": "what the doctor should do right now"
}}

urgency values: immediate, 24_hours, 48_hours, monitor
risk_level values: critical, high, moderate, low
primary_resistance_risk values: low, moderate, high

Respond ONLY with valid JSON, no other text."""


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("ExplainabilityAgent:running:Synthesizing recommendation with AI...")

    try:
        llm = get_llm()
        prompt = RECOMMENDATION_PROMPT.format(
            pathogen=state["pathogen"],
            mutations=json.dumps(state.get("mutations") or []),
            docking_results=json.dumps(state.get("docking_results") or []),
            admet_scores=json.dumps(state.get("admet_scores") or {}),
            resistance_scores=json.dumps(state.get("resistance_scores") or {}),
            selectivity_scores=json.dumps(state.get("selectivity_scores") or {}),
            similar_cases=json.dumps(state.get("similar_cases") or []),
        )

        response = llm.invoke(prompt)
        content = response.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        recommendation = json.loads(content)
        state["recommendation"] = recommendation
        state["urgency"] = recommendation.get("urgency", "monitor")
        state["risk_level"] = recommendation.get("risk_level", "low")
        state["plain_summary"] = recommendation.get("patient_summary", "")
        state["step_updates"].append("ExplainabilityAgent:complete:Recommendation generated")
    except Exception as e:
        logger.error(f"Explainability agent failed: {e}")
        state["step_updates"].append(f"ExplainabilityAgent:failed:LLM error: {str(e)[:50]}")
        # Set minimal recommendation to avoid null
        state["recommendation"] = {
            "primary_drug": "Consult specialist",
            "primary_confidence": 0,
            "primary_resistance_risk": "unknown",
            "alternative_drug": "—",
            "alternative_confidence": 0,
            "urgency": "immediate",
            "risk_level": "high",
            "doctor_summary": "Analysis incomplete. Manual clinical review required.",
            "patient_summary": "Please contact your doctor for guidance.",
            "action_required": "Manual review required — AI analysis failed.",
        }

    return state
