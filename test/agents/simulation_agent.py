import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class SimulationAgent:
    """
    Test version of SimulationAgent with enhanced stability prediction.
    """
    def __init__(self, config=None):
        self.config = config

    def _predict_stability(self, binding: float, resistance: float) -> Dict:
        norm_bind = max(0, min(1, (binding - (-5.0)) / (-12.0 - (-5.0))))
        stability_score = (norm_bind * 0.65) + ((1 - resistance) * 0.35)
        
        if resistance > 0.7:
            outcome = "fail"
            duration = "4-8 weeks"
            description = "High resistance profile detected."
        elif binding < -10.0 and resistance < 0.2:
            outcome = "stable"
            duration = "18 months+"
            description = "Optimal binding affinity."
        elif stability_score > 0.75:
            outcome = "stable"
            duration = "12 months+"
            description = "Strong molecular stability."
        elif stability_score > 0.5:
            outcome = "decline"
            duration = "6-9 months"
            description = "Moderate stability."
        else:
            outcome = "decline"
            duration = "3-6 months"
            description = "Sub-optimal stability."

        return {
            "predicted_outcome": outcome,
            "time_to_failure": duration,
            "outcome_description": description,
            "stability_score": round(stability_score, 4)
        }

    def run(self, decision_data, patient_profile):
        print("[SimulationAgent] Running clinical simulations...")
        ranked_drugs = decision_data.get("ranked_drugs", [])
        
        simulation_results = []
        for drug in ranked_drugs:
            sim_data = self._predict_stability(
                float(drug.get("binding", -5.0)),
                float(drug.get("resistance", 0.5))
            )
            drug.update(sim_data)
            simulation_results.append(drug)
            
        return {
            "simulation_results": simulation_results,
            "patient_profile": patient_profile
        }
