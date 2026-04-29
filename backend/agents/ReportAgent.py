import json
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("ReportAgent")


def run(state: PipelineState) -> PipelineState:
    """Generate final structured report."""
    state["step_updates"].append("ReportAgent:running:Generating final report...")

    recommendation = state.get("recommendation") or {}

    report = {
        "primaryDrug": recommendation.get("primary_drug", "—"),
        "primaryConfidence": recommendation.get("primary_confidence", 0),
        "primaryResistanceRisk": recommendation.get("primary_resistance_risk", "unknown"),
        "alternativeDrug": recommendation.get("alternative_drug", "—"),
        "alternativeConfidence": recommendation.get("alternative_confidence", 0),
        "urgency": recommendation.get("urgency", "monitor"),
        "riskLevel": recommendation.get("risk_level", "low"),
        "doctorSummary": recommendation.get("doctor_summary", ""),
        "patientSummary": recommendation.get("patient_summary", ""),
        "actionRequired": recommendation.get("action_required", ""),
        "resistanceScores": state.get("resistance_scores") or {},
        "similarCases": state.get("similar_cases") or [],
        "dockingResults": state.get("docking_results") or [],
        "admetScores": {},
    }

    # Pick best ADMET scores (from primary drug)
    admet = state.get("admet_scores") or {}
    primary_drug = recommendation.get("primary_drug", "")
    if primary_drug in admet:
        report["admetScores"] = admet[primary_drug]
    elif admet:
        report["admetScores"] = next(iter(admet.values()))

    # Add SMILES from top docking result
    docking = state.get("docking_results") or []
    if docking:
        top = docking[0]
        report["smiles"] = top.get("smiles")

    state["report"] = json.dumps(report)
    state["step_updates"].append("ReportAgent:complete:Report ready")
    return state
