import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class DecisionAgent:
    """
    Test version of DecisionAgent with enhanced ranking logic.
    """
    def __init__(self, config=None):
        self.config = config
        self.w_binding = 0.5
        self.w_resistance = 0.3
        self.w_patient_risk = 0.2

    def _normalize_binding(self, binding: float) -> float:
        val = max(min(binding, -5.0), -12.0)
        normalized = (val - (-5.0)) / (-12.0 - (-5.0))
        return normalized

    def run(self, input_data):
        print("[DecisionAgent] Ranking safe drugs...")
        drugs = input_data.get("drugs", [])
        mutation = input_data.get("mutation")
        
        ranked_list = []
        for drug in drugs:
            binding = float(drug.get("binding", -5.0))
            resistance = float(drug.get("resistance", 0.5))
            patient_risk = 0.5 # Default for test
            
            norm_binding = self._normalize_binding(binding)
            decision_score = (
                (self.w_binding * norm_binding) - 
                (self.w_resistance * resistance) - 
                (self.w_patient_risk * patient_risk)
            )
            
            drug["decision_score"] = round(decision_score, 4)
            ranked_list.append(drug)
            
        ranked_list.sort(key=lambda x: x["decision_score"], reverse=True)
        
        return {
            "ranked_drugs": ranked_list,
            "mutation": mutation
        }
