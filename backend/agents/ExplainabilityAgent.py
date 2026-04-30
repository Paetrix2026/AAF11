import json
from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.llm_router import get_llm

logger = get_logger("ExplainabilityAgent")

RECOMMENDATION_PROMPT = """You are a clinical AI assistant. Based on the pipeline analysis below, generate a treatment recommendation.

Pathogen: {pathogen}
Symptoms reported: {symptoms}
Mutations detected: {mutations}

Simulation Results (Stability & Time-to-Failure):
{simulation_results}

Decision Ranking (Weighted Scores):
{ranked_drugs}

Return ONLY a valid JSON object with these exact fields:
{{
  "primary_drug": "name of recommended drug",
  "primary_confidence": 85,
  "primary_resistance_risk": "low",
  "alternative_drug": "backup option name",
  "alternative_confidence": 70,
  "urgency": "immediate | switch | monitor | continue",
  "risk_level": "critical | high | moderate | low",
  "doctor_summary": "2-3 sentence clinical summary for the doctor. Mention stability and time-to-failure.",
  "patient_summary": "1 sentence plain English for patient",
  "action_required": "what the doctor should do right now based on urgency"
}}

Respond ONLY with valid JSON, no other text."""


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("ExplainabilityAgent:running:Synthesizing recommendation with AI...")

    # Ensure we have real data from previous agents
    simulation_results = state.get("simulation_results")
    ranked_drugs = state.get("ranked_drugs")

    if not ranked_drugs:
        raise ValueError("ExplainabilityAgent: Missing 'ranked_drugs'. Ensure Docking and Ranking agents are configured correctly.")

    if not simulation_results:
        raise ValueError("ExplainabilityAgent: Missing 'simulation_results'. Ensure Simulation/Outcome agent has executed.")

    try:
        # Prioritize Vertex AI for enterprise-grade synthesis
        llm = get_llm(provider="vertex")
        prompt = RECOMMENDATION_PROMPT.format(
            pathogen=state["pathogen"],
            symptoms=", ".join(state.get("symptoms") or ["None reported"]),
            mutations=json.dumps(state.get("mutations") or []),
            simulation_results=json.dumps(simulation_results, indent=2),
            ranked_drugs=json.dumps(ranked_drugs, indent=2),
        )

        try:
            response = llm.invoke(prompt)
        except Exception as gemini_err:
            logger.warning(f"Gemini failed, falling back to Groq: {gemini_err}")
            llm = get_llm(provider="groq")
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
        raise ValueError(f"ExplainabilityAgent: Failed to generate LLM recommendation: {str(e)}")

    return state
