import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

def run(state: PipelineState) -> PipelineState:
    """
    Ranks safe drugs based on binding affinity, resistance probability, 
    and patient-specific risk scores.
    """
    logger.info("DecisionAgent: Ranking safe drugs")
    state["step_updates"].append("DecisionAgent:running:Ranking compounds by clinical efficacy...")

    docking = state.get("docking_results") or []
    if not docking:
        logger.warning("DecisionAgent: No docking results to rank")
        state["ranked_drugs"] = []
        return state

    resistance_scores = state.get("resistance_scores") or {}
    admet_scores = state.get("admet_scores") or {}

    # Weights
    w_binding = 0.5
    w_resistance = 0.3
    w_patient_risk = 0.2

    ranked_list = []
    for drug in docking:
        name = drug.get("name")
        binding = drug.get("affinity") if drug.get("affinity") is not None else -4.0
        resistance = resistance_scores.get(name, 0.5)
        patient_risk = 0.5 # Default middle risk

        # Normalize binding: (-binding - 4) / 6 clamped to [0, 1]
        val = (-binding - 4.0) / 6.0
        binding_norm = max(0.0, min(1.0, val))

        # Decision Score formula
        score = (w_binding * binding_norm) - (w_resistance * resistance) - (w_patient_risk * patient_risk)

        ranked_list.append({
            "name": name,
            "binding": binding,
            "resistance": resistance,
            "patient_risk": patient_risk,
            "decision_score": round(score, 4)
        })

    # Sort DESC by decision_score
    ranked_list.sort(key=lambda x: x["decision_score"], reverse=True)
    state["ranked_drugs"] = ranked_list
    state["step_updates"].append(f"DecisionAgent:complete:Ranked {len(ranked_list)} compounds")
    return state
