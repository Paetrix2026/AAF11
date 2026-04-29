import json
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("ReportAgent")


def run(state: PipelineState) -> PipelineState:
    """Generate final structured report for Stage 3."""
    state["step_updates"].append("ReportAgent:running:Generating final report...")

    # Validate required fields
    recommendation = state.get("recommendation")
    if not recommendation:
        raise ValueError("ReportAgent: Missing 'recommendation' from previous stage - pipeline state incomplete")

    sim_results = state.get("simulation_results")
    if not sim_results:
        raise ValueError("ReportAgent: Missing 'simulation_results' from SimulationAgent - cannot generate report")

    # Extract details for the primary drug if possible
    primary_drug_name = recommendation.get("primary_drug", "")
    primary_data = next((d for d in sim_results if d.get("name") == primary_drug_name), {})

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
        "resistanceScores": state.get("resistance_scores") or {},
        "similarCases": state.get("similar_cases") or [],
        "dockingResults": state.get("docking_results") or [],
        "admetScores": state.get("admet_scores") or {},

        # Stage 2 Metrics
        "decisionScore": primary_data.get("decision_score", 0),
        "stabilityScore": primary_data.get("stability_score", 0),
        "predictedOutcome": primary_data.get("predicted_outcome", "unknown"),
        "timeToFailure": primary_data.get("time_to_failure", "unknown"),

        # Full simulation metadata
        "simulationResults": sim_results,
        "mutations": state.get("mutations") or [],
    }

    state["report"] = json.dumps(report)
    state["step_updates"].append("ReportAgent:complete:Report ready")
    return state
