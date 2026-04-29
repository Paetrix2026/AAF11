from typing import Dict, List


class SimulationAgent:
    """
    Simulates deterministic treatment outcomes from ranked drugs.
    """

    def run(self, ranked_drugs: List[Dict]) -> List[Dict]:
        if not ranked_drugs:
            raise ValueError("SimulationAgent: 'ranked_drugs' is required and cannot be empty.")

        simulation_results: List[Dict] = []

        for drug in ranked_drugs:
            name = drug.get("name")
            binding = float(drug.get("binding", 0.0))
            resistance = float(drug.get("resistance", 0.0))
            patient_risk = float(drug.get("patient_risk", 0.0))
            score = float(drug.get("score", 0.0))

            if resistance > 0.7:
                outcome = "fail"
                time_to_failure = "1-2 months"
            elif binding <= -9.0:
                outcome = "stable"
                time_to_failure = "6+ months"
            else:
                outcome = "decline"
                time_to_failure = "3-4 months"

            simulation_results.append(
                {
                    "name": name,
                    "binding": binding,
                    "resistance": resistance,
                    "patient_risk": patient_risk,
                    "score": round(score, 4),
                    "outcome": outcome,
                    "time_to_failure": time_to_failure,
                }
            )

        return simulation_results
