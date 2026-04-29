import json
import os
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("ResistanceAgent")


def load_resistance_data() -> dict:
    """Load mutation-resistance reference data."""
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "structures", "mutation_resistance.json")
    try:
        with open(data_path) as f:
            return json.load(f)
    except Exception:
        return {}


def score_resistance(mutations: list, drug: str, resistance_data: dict) -> float:
    """Score resistance probability for a drug given mutations."""
    if not mutations or not resistance_data:
        return 0.1  # Default low resistance if no data

    drug_resistance = resistance_data.get(drug, {})
    if not drug_resistance:
        return 0.1

    score = 0.0
    for mutation in mutations:
        if mutation in drug_resistance:
            score += drug_resistance[mutation]

    return min(1.0, score)


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("ResistanceAgent:running:Scoring resistance profiles...")
    mutations = state.get("mutations") or []
    docking = state.get("docking_results") or []
    resistance_data = load_resistance_data()

    resistance_scores = {}
    for compound in docking:
        name = compound.get("name")
        if name:
            resistance_scores[name] = score_resistance(mutations, name, resistance_data)

    state["resistance_scores"] = resistance_scores
    state["step_updates"].append(f"ResistanceAgent:complete:Scored resistance for {len(resistance_scores)} compound(s)")
    return state
