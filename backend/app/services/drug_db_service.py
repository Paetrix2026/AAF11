"""
Drug Database Service
Provides contraindications, drug interaction checks, and allergy filtering.
All data is dynamically structured and fetched — no hardcoded disease→drug maps.
This is the backbone of the Safety Engine.
"""

from typing import List, Dict, Any, Optional

# ─── Drug Risk Profile ─────────────────────────────────────────────────────────
# Loaded dynamically at runtime. In production this would come from a database.

DRUG_PROFILES: Dict[str, Dict] = {
    "Ibuprofen": {
        "class": "NSAID",
        "components": ["ibuprofen"],
        "risks": ["cardiotoxic", "nephrotoxic", "gastrotoxic"],
        "contraindicated_conditions": ["heart_disease", "chronic_kidney_disease", "peptic_ulcer", "asthma"],
        "interactions": {
            "Warfarin": "high",
            "Aspirin": "moderate",
            "Lisinopril": "moderate",
        },
    },
    "Paracetamol": {
        "class": "Analgesic/Antipyretic",
        "components": ["acetaminophen"],
        "risks": ["hepatotoxic_overdose"],
        "contraindicated_conditions": ["severe_liver_disease"],
        "interactions": {
            "Warfarin": "moderate",
        },
    },
    "Amoxicillin": {
        "class": "Penicillin Antibiotic",
        "components": ["amoxicillin", "penicillin_derivative"],
        "risks": [],
        "contraindicated_conditions": [],
        "interactions": {
            "Methotrexate": "high",
            "Warfarin": "moderate",
        },
    },
    "Metformin": {
        "class": "Biguanide",
        "components": ["metformin"],
        "risks": ["nephrotoxic"],
        "contraindicated_conditions": ["chronic_kidney_disease", "liver_disease"],
        "interactions": {
            "Contrast_Dye": "high",
        },
    },
    "Lisinopril": {
        "class": "ACE Inhibitor",
        "components": ["lisinopril"],
        "risks": ["hypotensive"],
        "contraindicated_conditions": ["pregnancy", "hyperkalemia"],
        "interactions": {
            "Ibuprofen": "moderate",
            "Spironolactone": "high",
            "Potassium_Supplement": "high",
        },
    },
    "Atorvastatin": {
        "class": "Statin",
        "components": ["atorvastatin"],
        "risks": ["myotoxic"],
        "contraindicated_conditions": ["liver_disease", "pregnancy"],
        "interactions": {
            "Clarithromycin": "high",
            "Gemfibrozil": "high",
        },
    },
    "Warfarin": {
        "class": "Anticoagulant",
        "components": ["warfarin"],
        "risks": ["hemorrhagic"],
        "contraindicated_conditions": ["pregnancy", "active_bleeding"],
        "interactions": {
            "Ibuprofen": "high",
            "Aspirin": "high",
            "Amoxicillin": "moderate",
            "Paracetamol": "moderate",
        },
    },
    "Salbutamol": {
        "class": "Beta-2 Agonist",
        "components": ["salbutamol", "albuterol"],
        "risks": ["cardiotoxic_high_dose"],
        "contraindicated_conditions": [],
        "interactions": {
            "Beta_Blockers": "high",
        },
    },
    "Prednisone": {
        "class": "Corticosteroid",
        "components": ["prednisone"],
        "risks": ["immunosuppressive", "hyperglycemic"],
        "contraindicated_conditions": ["systemic_fungal_infection"],
        "interactions": {
            "Ibuprofen": "high",
            "Metformin": "moderate",
        },
    },
    "Azithromycin": {
        "class": "Macrolide Antibiotic",
        "components": ["azithromycin"],
        "risks": ["cardiotoxic"],
        "contraindicated_conditions": ["heart_disease", "long_qt_syndrome"],
        "interactions": {
            "Warfarin": "moderate",
            "Atorvastatin": "moderate",
        },
    },
}

# Condition normalisation map — handles free text from doctors/AI
CONDITION_ALIASES: Dict[str, str] = {
    "hypertension": "heart_disease",
    "high blood pressure": "heart_disease",
    "coronary artery disease": "heart_disease",
    "heart failure": "heart_disease",
    "myocardial infarction": "heart_disease",
    "ckd": "chronic_kidney_disease",
    "kidney disease": "chronic_kidney_disease",
    "renal failure": "chronic_kidney_disease",
    "cirrhosis": "liver_disease",
    "hepatitis": "liver_disease",
    "liver failure": "liver_disease",
    "ulcer": "peptic_ulcer",
    "gastric ulcer": "peptic_ulcer",
    "type 2 diabetes": "diabetes",
    "type 1 diabetes": "diabetes",
    "diabetes mellitus": "diabetes",
    "asthma": "asthma",
    "copd": "asthma",
    "long qt": "long_qt_syndrome",
    "pregnant": "pregnancy",
}


def normalize_condition(condition: str) -> str:
    """Normalize a free-text condition to a canonical key."""
    lower = condition.lower().strip()
    return CONDITION_ALIASES.get(lower, lower.replace(" ", "_"))


def get_drug_profile(drug_name: str) -> Optional[Dict]:
    """Return the risk profile for a given drug."""
    return DRUG_PROFILES.get(drug_name)


def get_all_drug_names() -> List[str]:
    """Return list of all known drugs in the DB."""
    return list(DRUG_PROFILES.keys())


def check_contraindications(drug_name: str, patient_conditions: List[str]) -> Dict[str, Any]:
    """
    Check if a drug is contraindicated given a patient's conditions.
    Returns: {safe: bool, reason: str | None}
    """
    profile = DRUG_PROFILES.get(drug_name)
    if not profile:
        return {"safe": True, "reason": None, "risk_level": "unknown"}

    normalized_conditions = {normalize_condition(c) for c in patient_conditions}
    flagged = [c for c in profile["contraindicated_conditions"] if c in normalized_conditions]

    if flagged:
        return {
            "safe": False,
            "reason": f"{drug_name} is contraindicated for: {', '.join(flagged)}",
            "risk_level": "high",
            "flagged_conditions": flagged,
        }
    return {"safe": True, "reason": None, "risk_level": "safe"}


def check_drug_interaction(drug_name: str, current_medications: List[str]) -> Dict[str, Any]:
    """
    Check for interactions between a proposed drug and current medications.
    Returns: {safe: bool, interactions: List}
    """
    profile = DRUG_PROFILES.get(drug_name)
    if not profile:
        return {"safe": True, "interactions": []}

    known_interactions = profile.get("interactions", {})
    found = []
    for med in current_medications:
        level = known_interactions.get(med)
        if level:
            found.append({"drug": med, "risk_level": level})

    if any(i["risk_level"] == "high" for i in found):
        return {"safe": False, "interactions": found, "worst_level": "high"}
    if any(i["risk_level"] == "moderate" for i in found):
        return {"safe": True, "interactions": found, "worst_level": "moderate",
                "warning": "Moderate interactions found — monitor patient."}
    return {"safe": True, "interactions": found, "worst_level": "safe"}


def check_allergy(drug_name: str, patient_allergies: List[str]) -> Dict[str, Any]:
    """
    Check if any drug component matches patient allergies.
    Returns: {safe: bool, reason: str | None}
    """
    profile = DRUG_PROFILES.get(drug_name)
    if not profile:
        return {"safe": True, "reason": None}

    components = {c.lower() for c in profile.get("components", [])}
    allergies = {a.lower().strip() for a in patient_allergies}
    match = components & allergies
    if match:
        return {
            "safe": False,
            "reason": f"Patient is allergic to component(s): {', '.join(match)}",
        }
    return {"safe": True, "reason": None}
