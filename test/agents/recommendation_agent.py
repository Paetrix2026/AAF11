import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class RecommendationAgent:
    """
    Test version of RecommendationAgent with enhanced clinical synthesis.
    """
    def __init__(self, config=None):
        self.config = config

    def _determine_risk_level(self, drug: Dict) -> str:
        resistance = drug.get("resistance", 0.5)
        patient_risk = 0.5 # Default for test
        outcome = drug.get("predicted_outcome", "decline")
        stability = drug.get("stability_score", 0.0)
        
        if outcome == "fail" or (patient_risk > 0.85 and resistance > 0.6):
            return "critical"
        if resistance > 0.6 or patient_risk > 0.7 or stability < 0.3:
            return "high"
        if resistance > 0.35 or patient_risk > 0.4 or stability < 0.6:
            return "moderate"
        return "low"

    def _determine_urgency(self, risk: str, outcome: str) -> str:
        if risk == "critical":
            return "immediate"
        if risk == "high" or outcome == "fail":
            return "switch"
        if risk == "moderate" or outcome == "decline":
            return "monitor"
        return "continue"

    def _generate_decision_text(self, drug_name: str, risk: str, urgency: str, desc: str) -> str:
        base_guidance = f"Recommendation for {drug_name}: "
        if urgency == "immediate":
            return base_guidance + f"STOP. {desc}"
        if urgency == "switch":
            return base_guidance + f"PLAN SWITCH. {desc}"
        if urgency == "monitor":
            return base_guidance + f"MAINTAIN WITH MONITORING. {desc}"
        return base_guidance + f"MAINTAIN DOSAGE. {desc}"

    def run(self, simulation_data):
        print("[RecommendationAgent] Synthesizing final recommendations...")
        sim_results = simulation_data.get("simulation_results", [])
        
        recommendations = []
        for drug in sim_results:
            name = drug.get("name", "Unknown")
            desc = drug.get("outcome_description", "")
            
            risk = self._determine_risk_level(drug)
            urgency = self._determine_urgency(risk, drug.get("predicted_outcome", "decline"))
            decision = self._generate_decision_text(name, risk, urgency, desc)
            
            effectiveness = "high" if drug.get("stability_score", 0) > 0.8 else \
                            "moderate" if drug.get("stability_score", 0) > 0.55 else "low"

            recommendations.append({
                "drug": name,
                "effectiveness": effectiveness,
                "risk": risk,
                "urgency": urgency,
                "decision": decision,
                "metadata": {
                    "stability": drug.get("stability_score"),
                    "outcome": drug.get("predicted_outcome")
                }
            })

        recommendations.sort(key=lambda x: (x["risk"] != "low", x["effectiveness"] != "high"))
        
        return {
            "recommendations": recommendations
        }
