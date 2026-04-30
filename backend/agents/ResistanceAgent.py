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


async def score_resistance_dynamic(mutations: list, drug: str, pathogen: str) -> float:
    """Use AI to estimate resistance probability if not in database."""
    from utils.llm_router import get_llm
    llm = get_llm(provider="groq")

    prompt = f"""
    As a clinical pharmacologist, estimate the probability (0.0 to 1.0) that the mutations {mutations}
    induce resistance in the drug '{drug}' for the condition/pathogen '{pathogen}'.

    CRITICAL: Different drugs have different mechanisms (e.g., AChE inhibitors vs NMDA antagonists).
    Do NOT provide identical scores for different drug classes.
    Analyze how the mutation impacts the specific biological target of '{drug}'.

    Return ONLY a single float between 0.0 and 1.0.
    """
    try:
        response = await llm.ainvoke(prompt)
        score_text = response.content.strip()
        # Extract float
        import re
        match = re.search(r"(\d+\.\d+|\d+)", score_text)
        if match:
            return min(1.0, float(match.group(1)))
    except Exception as e:
        logger.warning(f"Dynamic resistance scoring failed for {drug}: {e}")

    return 0.1 # Fallback


async def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("ResistanceAgent:running:Scoring resistance profiles...")
    mutations = state.get("mutations") or []
    pathogen = state.get("pathogen", "Unknown")

    docking = state.get("docking_results")
    if not docking:
        logger.warning("ResistanceAgent: No docking results found, skipping resistance scoring")
        return state

    resistance_data = load_resistance_data()
    resistance_scores = {}

    for compound in docking:
        name = compound.get("name")
        if not name: continue

        # Try static data first
        score = score_resistance(mutations, name, resistance_data)

        # If static data returned default (0.1) and we have mutations, try dynamic AI scoring
        if score == 0.1 and mutations:
            dynamic = await score_resistance_dynamic(mutations, name, pathogen)
            # Sanity-clamp: unknown compounds should never score > 0.6 from LLM alone
            score = min(dynamic, 0.6)

        resistance_scores[name] = round(score, 3)

    state["resistance_scores"] = resistance_scores
    state["step_updates"].append(f"ResistanceAgent:complete:Scored resistance for {len(resistance_scores)} compound(s)")
    return state
