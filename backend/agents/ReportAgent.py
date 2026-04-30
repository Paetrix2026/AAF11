import json
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("ReportAgent")


def run(state: PipelineState) -> PipelineState:
    """Generate final structured report for Stage 3."""
    state["step_updates"].append("ReportAgent:running:Generating final report...")

    # Ensure real data for the report
    recommendation = state.get("recommendation")
    if not recommendation:
        raise ValueError("ReportAgent: Missing 'recommendation'. ExplainabilityAgent must complete successfully.")

    sim_results = state.get("simulation_results") or []

    # Extract details for the primary drug if possible (case-insensitive match)
    primary_drug_name = recommendation.get("primary_drug", "")
    primary_data = next((d for d in sim_results if d.get("name", "").lower() == primary_drug_name.lower()), {})

    report = {
        "primaryDrug": primary_drug_name or "",
        "primaryConfidence": recommendation.get("primary_confidence", 0),
        "primaryResistanceRisk": recommendation.get("primary_resistance_risk", "unknown"),
        "alternativeDrug": recommendation.get("alternative_drug", ""),
        "alternativeConfidence": recommendation.get("alternative_confidence", 0),
        "urgency": recommendation.get("urgency", "monitor"),
        "riskLevel": recommendation.get("risk_level", "low"),
        "doctorSummary": recommendation.get("doctor_summary", ""),
        "patientSummary": recommendation.get("patient_summary", ""),
        "actionRequired": recommendation.get("action_required", ""),
        # Use resistance_scores from state; if agent was skipped, derive from simulation results
        "resistanceScores": (
            state.get("resistance_scores")
            or {
                d.get("name"): round(d.get("resistance", 0.1), 3)
                for d in sim_results
                if d.get("name")
            }
            or {}
        ),
        "similarCases": state.get("similar_cases") or [],
        "dockingResults": state.get("docking_results") or [],
        "admetScores": state.get("admet_scores", {}).get(next((k for k in state.get("admet_scores", {}).keys() if k.lower() == primary_drug_name.lower()), primary_drug_name), {}),
        "smiles": next((d.get("smiles") for d in state.get("docking_results", []) if d.get("name", "").lower() == primary_drug_name.lower()), ""),

        # Stage 2 Metrics
        "decisionScore": primary_data.get("decision_score", 0),
        "stabilityScore": primary_data.get("stability_score", 0),
        "predictedOutcome": primary_data.get("predicted_outcome", "unknown"),
        "timeToFailure": primary_data.get("time_to_failure", "unknown"),

        # Full simulation metadata
        "simulationResults": sim_results,
        "mutations": state.get("mutations") or [],
        "symptoms": state.get("symptoms") or [],
    }

    state["report"] = report
    state["step_updates"].append("ReportAgent:complete:Report ready")
    return state
