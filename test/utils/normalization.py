def normalize_drug_data(drugs):
    """
    Ensures all drug data has required fields with default values.
    """
    normalized = []
    for drug in drugs:
        normalized.append({
            "name": drug.get("name", "Unknown"),
            "binding": float(drug.get("binding", 0.0)),
            "resistance": float(drug.get("resistance", 0.0))
        })
    return normalized

def scale_value(value, min_val, max_val):
    if max_val == min_val:
        return 0.5
    return (value - min_val) / (max_val - min_val)
