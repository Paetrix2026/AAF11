def calculate_risk_score(binding_affinity, resistance_score, patient_factors):
    """
    Calculates a risk score based on binding, resistance and patient factors.
    Lower binding affinity (more negative) is better.
    Higher resistance score is worse.
    """
    base_score = abs(binding_affinity) * (1 - resistance_score)
    
    # Adjust based on patient factors
    if patient_factors.get("heart_condition"):
        base_score *= 0.8
    
    return base_score

def determine_urgency(score):
    if score > 5:
        return "immediate"
    elif score > 3:
        return "monitor"
    return "low"
