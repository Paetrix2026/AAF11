import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

class RecommendationAgent:
    """
    Synthesizes simulation results into final risk-aware recommendations.
    Provides risk levels, urgency codes, and actionable decisions.
    """

    def run(self, state_or_sim_results) -> Dict:
        """
        Executes the RecommendationAgent logic.
        """
        logger.info("RecommendationAgent: Finalizing Stage 2 recommendations")

        if isinstance(state_or_sim_results, dict):
            sim_results = state_or_sim_results.get("simulation_results")
            if not sim_results:
                raise ValueError("RecommendationAgent: Missing 'simulation_results' - cannot create recommendations without simulation data")
        else:
            sim_results = state_or_sim_results
            if not sim_results:
                raise ValueError("RecommendationAgent: Received empty simulation results - cannot generate recommendations")

        recommendations = []
        for drug in sim_results:
            name = drug.get("name")
            outcome = drug.get("predicted_outcome")
            risk_score = drug.get("patient_risk", 0.0)

            # Stage 2 Assignment Logic
            if outcome == "fail":
                risk = "CRITICAL"
                urgency = "immediate"
                decision = "avoid drug"
            elif outcome == "decline":
                risk = "HIGH"
                urgency = "switch"
                decision = "switch treatment"
            elif risk_score > 0.4:
                risk = "MODERATE"
                urgency = "monitor"
                decision = "monitor closely"
            else:
                risk = "LOW"
                urgency = "continue"
                decision = "continue"

            recommendations.append({
                "drug": name,
                "risk": risk,
                "urgency": urgency,
                "decision": decision
            })

        return {
            "recommendations": recommendations
        }
