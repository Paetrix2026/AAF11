import json
import os
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("SelectivityAgent")


def load_off_target_data() -> dict:
    """Load off-target protein data."""
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "structures", "off_target_proteins.json")
    try:
        with open(data_path) as f:
            return json.load(f)
    except Exception:
        return {}


def score_selectivity(smiles: str, drug_name: str, off_target_data: dict) -> float:
    """Score selectivity (1 = highly selective, 0 = many off-targets)."""
    if not smiles:
        return 0.5

    drug_off_targets = off_target_data.get(drug_name, {})
    if not drug_off_targets:
        return 0.8  # Assume decent selectivity if no data

    off_target_count = len(drug_off_targets)
    return max(0.0, 1.0 - off_target_count * 0.1)


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("SelectivityAgent:running:Checking off-target binding...")
    docking = state.get("docking_results")
    if not docking:
        logger.warning("SelectivityAgent: No docking results found, skipping selectivity scoring")
        return state

    off_target_data = load_off_target_data()

    selectivity_scores = {}
    for compound in docking:
        name = compound.get("name")
        smiles = compound.get("smiles", "")
        if name:
            selectivity_scores[name] = score_selectivity(smiles, name, off_target_data)

    state["selectivity_scores"] = selectivity_scores
    state["step_updates"].append(f"SelectivityAgent:complete:Scored selectivity for {len(selectivity_scores)} compound(s)")
    return state
