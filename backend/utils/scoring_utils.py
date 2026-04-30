import json
from typing import List, Dict

def calculate_simple_decision_score(affinity: float, resistance: float = 0.5, patient_risk: float = 0.5) -> float:
    """
    A simplified decision score for the manual docking tool.
    Avoids dependency on complex Pipeline state or stateful Agents.
    """
    if affinity is None:
        return 0.0
    
    # Invert affinity (lower is better, e.g., -9.0 -> 9.0)
    # Scale: -10 to 0 -> 0 to 10
    binding_score = max(0, -affinity)
    
    # Weights: Binding(60%), Resistance(20%), Safety(20%)
    score = (binding_score * 0.6) + ((1 - resistance) * 0.2) + ((1 - patient_risk) * 0.2)
    return score

def get_simple_resistance_estimate(compound_name: str) -> float:
    """
    Hardcoded baseline resistance for manual docking screening.
    """
    baselines = {
        "Oseltamivir": 0.15,
        "Favipiravir": 0.05,
        "Remdesivir": 0.08,
        "Molnupiravir": 0.10,
        "Zanamivir": 0.12,
        "Peramivir": 0.14
    }
    return baselines.get(compound_name, 0.25)
