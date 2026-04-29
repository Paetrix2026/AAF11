from typing import Dict, List


class RecommendationAgent:
    """
    Converts simulation results into actionable recommendations.
    """

    def run(self, simulation_results: List[Dict]) -> Dict:
        if not simulation_results:
            raise ValueError("RecommendationAgent: 'simulation_results' is required and cannot be empty.")

        recommendations: List[Dict] = []

        for result in simulation_results:
            drug_name = result.get("name")
            outcome = result.get("outcome")
            resistance = float(result.get("resistance", 0.0))
            patient_risk = float(result.get("patient_risk", 0.0))

            if outcome == "fail":
                risk = "CRITICAL"
                urgency = "immediate"
                decision = "avoid drug"
            elif outcome == "decline":
                risk = "HIGH"
                urgency = "switch"
                decision = "switch treatment"
            elif resistance > 0.5 or patient_risk > 0.5:
                risk = "MODERATE"
                urgency = "monitor"
                decision = "monitor closely"
            else:
                risk = "LOW"
                urgency = "continue"
                decision = "continue"

            recommendations.append(
                {
                    "drug": drug_name,
                    "risk": risk,
                    "urgency": urgency,
                    "decision": decision,
                }
            )

        return {"recommendations": recommendations}
