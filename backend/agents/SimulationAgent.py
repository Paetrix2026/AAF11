import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

def _predict_stability(binding: float, resistance: float) -> Dict:
    """
    Stage 2 Simulation Rules (Lightweight).
    """
    if resistance > 0.7:
        outcome = "fail"
        time_to_failure = "1-2 months"
    elif binding < -9.0:
        outcome = "stable"
        time_to_failure = "6+ months"
    else:
        outcome = "decline"
        time_to_failure = "3-4 months"

    return {
        "predicted_outcome": outcome,
        "time_to_failure": time_to_failure
    }

def run(state: PipelineState) -> PipelineState:
    """
    Simulates clinical outcomes for ranked drugs using rule-based logic.
    Focuses on predicted stability and time-to-failure.
    """
    logger.info("SimulationAgent: Running clinical simulations")
    state["step_updates"].append("SimulationAgent:running:Simulating clinical stability...")

    ranked_drugs = state.get("ranked_drugs")
    if not ranked_drugs:
        logger.warning("SimulationAgent: Missing 'ranked_drugs' - cannot simulate")
        state["simulation_results"] = []
        return state

    simulation_results = []
    for drug in ranked_drugs:
        binding = drug.get("binding") if drug.get("binding") is not None else -4.0
        resistance = drug.get("resistance") if drug.get("resistance") is not None else 0.5
        
        sim_data = _predict_stability(binding, resistance)

        # Stage 2 Contract
        res = {
            "name": drug.get("name"),
            "binding": binding,
            "resistance": resistance,
            "patient_risk": drug.get("patient_risk"),
            "decision_score": drug.get("decision_score"),
            "predicted_outcome": sim_data["predicted_outcome"],
            "time_to_failure": sim_data["time_to_failure"]
        }
        simulation_results.append(res)

    state["simulation_results"] = simulation_results
    state["step_updates"].append(f"SimulationAgent:complete:Simulated outcomes for {len(simulation_results)} drugs")
    return state
