import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

class DecisionAgent:
    """
    Ranks safe drugs based on binding affinity, resistance probability, 
    and patient-specific risk scores.
    """
    
    def __init__(self):
        # Default weights for the decision formula
        self.w_binding = 0.5
        self.w_resistance = 0.3
        self.w_patient_risk = 0.2

    def _normalize_binding(self, binding: float) -> float:
        """
        Stage 2 Normalization: binding_norm = clamp((-binding - 4) / 6, 0, 1)
        """
        val = (-binding - 4.0) / 6.0
        return max(0.0, min(1.0, val))

    def run(self, state_or_safe_drugs) -> List[Dict]:
        """
        Executes the DecisionAgent logic.
        Supports both PipelineState and direct list input for flexibility.
        """
        logger.info("DecisionAgent: Ranking safe drugs")

        if isinstance(state_or_safe_drugs, dict):
            safe_drugs = state_or_safe_drugs.get("safe_drugs")
            if not safe_drugs:
                raise ValueError("DecisionAgent: Missing 'safe_drugs' - cannot rank drugs without prior analysis")
        else:
            safe_drugs = state_or_safe_drugs
            if not safe_drugs:
                raise ValueError("DecisionAgent: Received empty drug list - cannot rank without drugs")

        ranked_list = []
        for drug in safe_drugs:
            binding = drug.get("binding", -4.0)
            resistance = drug.get("resistance", 0.5)
            patient_risk = drug.get("patient_risk", 0.5)

            binding_norm = self._normalize_binding(binding)

            # Stage 2 Score formula
            score = (
                (0.5 * binding_norm) -
                (0.3 * resistance) -
                (0.2 * patient_risk)
            )

            ranked_list.append({
                "name": drug.get("name"),
                "binding": binding,
                "resistance": resistance,
                "patient_risk": patient_risk,
                "decision_score": round(score, 4)
            })

        # Sort DESC by decision_score
        ranked_list.sort(key=lambda x: x["decision_score"], reverse=True)
        return ranked_list
