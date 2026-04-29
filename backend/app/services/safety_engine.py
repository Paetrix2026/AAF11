"""
Safety Engine ⭐ — Core Differentiator
Validates every drug against patient profile BEFORE Gemini sees it.
Runs three independent checks: Contraindications → Interactions → Allergies.
Result: only safe drugs are passed to the treatment engine.
"""

from typing import List, Dict, Any
from app.services.drug_db_service import (
    check_contraindications,
    check_drug_interaction,
    check_allergy,
    get_all_drug_names,
)


def validate_single_drug(
    drug_name: str,
    chronic_conditions: List[str],
    current_medications: List[str],
    allergies: List[str],
) -> Dict[str, Any]:
    """
    Run the three-layer safety check on a single drug.
    Returns a detailed validation result.
    """
    result = {
        "drug": drug_name,
        "safe": True,
        "blocked_reasons": [],
        "warnings": [],
        "checks": {},
    }

    # ── Layer 1: Contraindication Check ───────────────────────────────────────
    contra = check_contraindications(drug_name, chronic_conditions)
    result["checks"]["contraindication"] = contra
    if not contra["safe"]:
        result["safe"] = False
        result["blocked_reasons"].append(contra["reason"])

    # ── Layer 2: Drug Interaction Check ───────────────────────────────────────
    interaction = check_drug_interaction(drug_name, current_medications)
    result["checks"]["interaction"] = interaction
    if not interaction["safe"]:
        result["safe"] = False
        result["blocked_reasons"].append(
            f"High-risk interaction with: {', '.join(i['drug'] for i in interaction['interactions'])}"
        )
    elif interaction.get("warning"):
        result["warnings"].append(interaction["warning"])

    # ── Layer 3: Allergy Check ────────────────────────────────────────────────
    allergy = check_allergy(drug_name, allergies)
    result["checks"]["allergy"] = allergy
    if not allergy["safe"]:
        result["safe"] = False
        result["blocked_reasons"].append(allergy["reason"])

    return result


def filter_safe_drugs(
    candidate_drugs: List[str],
    chronic_conditions: List[str],
    current_medications: List[str],
    allergies: List[str],
) -> Dict[str, Any]:
    """
    Filter a list of candidate drugs through all safety checks.
    Returns approved drugs, blocked drugs, and a full audit trail.
    """
    approved = []
    blocked = []
    audit = []

    for drug in candidate_drugs:
        result = validate_single_drug(drug, chronic_conditions, current_medications, allergies)
        audit.append(result)
        if result["safe"]:
            approved.append({"drug": drug, "warnings": result["warnings"]})
        else:
            blocked.append({
                "drug": drug,
                "reasons": result["blocked_reasons"],
            })

    return {
        "approved_drugs": approved,
        "blocked_drugs": blocked,
        "audit_trail": audit,
        "total_candidates": len(candidate_drugs),
        "total_approved": len(approved),
        "total_blocked": len(blocked),
    }


def run_full_safety_report(
    proposed_drugs: List[str],
    chronic_conditions: List[str],
    current_medications: List[str],
    allergies: List[str],
) -> Dict[str, Any]:
    """
    Top-level safety report. Use this in the API.
    """
    report = filter_safe_drugs(
        candidate_drugs=proposed_drugs,
        chronic_conditions=chronic_conditions,
        current_medications=current_medications,
        allergies=allergies,
    )
    report["safety_grade"] = (
        "PASS" if report["total_blocked"] == 0
        else "PARTIAL" if report["total_approved"] > 0
        else "FAIL"
    )
    return report
