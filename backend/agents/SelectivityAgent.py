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


async def score_selectivity_dynamic(drug: str) -> float:
    """Use AI to estimate selectivity if not in database."""
    from utils.llm_router import get_llm
    llm = get_llm(provider="groq")
    
    prompt = f"""
    As a clinical pharmacologist, estimate the selectivity score (0.0 to 1.0) for the drug '{drug}'.
    A score of 1.0 means highly selective (few off-targets). 
    A score of 0.0 means highly non-selective (many dangerous off-target bindings).
    
    Be precise and differentiate between drugs based on their known side-effect profiles and target specificity.
    Return ONLY a single float between 0.0 and 1.0.
    """
    try:
        response = await llm.ainvoke(prompt)
        score_text = response.content.strip()
        import re
        match = re.search(r"(\d+\.\d+|\d+)", score_text)
        if match:
            return min(1.0, float(match.group(1)))
    except Exception as e:
        logger.warning(f"Dynamic selectivity scoring failed for {drug}: {e}")
    
    return 0.8 # Fallback


async def run(state: PipelineState) -> PipelineState:
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
        if not name: continue
        
        # Try static data
        score = score_selectivity(smiles, name, off_target_data)
        
        # If static data returned default (0.8), try dynamic AI scoring
        if score == 0.8:
            score = await score_selectivity_dynamic(name)
            
        selectivity_scores[name] = score

    state["selectivity_scores"] = selectivity_scores
    state["step_updates"].append(f"SelectivityAgent:complete:Scored selectivity for {len(selectivity_scores)} compound(s)")
    return state
