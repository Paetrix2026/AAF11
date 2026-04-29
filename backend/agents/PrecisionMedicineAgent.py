import logging
from typing import List, Dict
from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

class PrecisionMedicineAgent:
    """
    Filters drugs based on patient profile and identifies risks.
    """
    def __init__(self, config=None):
        self.config = config

    def run(self, docking_results: List[Dict], patient_profile: Dict) -> List[Dict]:
        """
        Executes the PrecisionMedicineAgent logic.
        """
        logger.info("PrecisionMedicineAgent: Filtering drugs based on patient profile")
        
        heart_condition = patient_profile.get("heart_condition", False)
        medications = patient_profile.get("medications", [])
        
        safe_drugs = []
        for drug in docking_results:
            name = drug.get("name")
            side_effects = drug.get("side_effects", [])
            interactions = drug.get("interactions", [])
            
            # 1. Heart condition safety check
            if heart_condition and "cardiotoxic" in side_effects:
                logger.info(f"PrecisionMedicineAgent: Removing {name} due to cardiotoxicity risk")
                continue
            
            # 2. Medication interaction check & Patient Risk calculation
            patient_risk = 0.0
            
            # Interaction penalty
            for med in medications:
                if med in interactions:
                    logger.info(f"PrecisionMedicineAgent: Interaction detected between {name} and {med}")
                    patient_risk += 0.4
            
            # Side effect baseline risk
            if side_effects:
                patient_risk += 0.1
                
            # Clamp patient_risk to [0, 1]
            patient_risk = min(1.0, patient_risk)
            
            safe_drugs.append({
                "name": name,
                "binding": drug.get("binding", -5.0),
                "resistance": drug.get("resistance", 0.5),
                "patient_risk": patient_risk
            })
            
        return safe_drugs
