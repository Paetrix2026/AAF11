import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

class SimulationAgent:
    """
    Simulates clinical outcomes for ranked drugs using rule-based logic.
    Focuses on predicted stability and time-to-failure.
    """

    def _predict_stability(self, binding: float, resistance: float) -> Dict:
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

    def run(self, state_or_ranked_drugs) -> List[Dict]:
        """
        Executes the SimulationAgent logic.
        """
        logger.info("SimulationAgent: Running clinical simulations")

        if isinstance(state_or_ranked_drugs, dict):
            ranked_drugs = state_or_ranked_drugs.get("ranked_drugs")
            if not ranked_drugs:
                raise ValueError("SimulationAgent: Missing 'ranked_drugs' - cannot simulate without ranked drug list")
        else:
            ranked_drugs = state_or_ranked_drugs
            if not ranked_drugs:
                raise ValueError("SimulationAgent: Received empty drug list - cannot simulate without drugs")

        simulation_results = []
        for drug in ranked_drugs:
            sim_data = self._predict_stability(
                drug.get("binding", -4.0),
                drug.get("resistance", 0.5)
            )

            # Stage 2 Contract
            res = {
                "name": drug.get("name"),
                "binding": drug.get("binding"),
                "resistance": drug.get("resistance"),
                "patient_risk": drug.get("patient_risk"),
                "decision_score": drug.get("decision_score"),
                "predicted_outcome": sim_data["predicted_outcome"],
                "time_to_failure": sim_data["time_to_failure"]
            }
            simulation_results.append(res)

        return simulation_results
