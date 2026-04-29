"""
OrchestratorAgent — coordinates the pipeline execution.

The main pipeline is orchestrated via LangGraph in pipeline/graph.py.
This module provides helper utilities for direct orchestration use cases
outside of the LangGraph graph, e.g., testing or manual invocation.
"""
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("OrchestratorAgent")


def create_initial_state(
    patient_id: str,
    pathogen: str,
    variant: str | None = None,
    symptoms: list | None = None,
    run_id: str | None = None,
) -> PipelineState:
    """Create a blank initial state for the pipeline."""
    return {
        "patient_id": patient_id,
        "pathogen": pathogen,
        "variant": variant,
        "symptoms": symptoms or [],
        "sequences": None,
        "mutations": None,
        "structure_pdb": None,
        "docking_results": None,
        "admet_scores": None,
        "resistance_scores": None,
        "selectivity_scores": None,
        "similar_cases": None,
        "recommendation": None,
        "plain_summary": None,
        "urgency": None,
        "risk_level": None,
        "report": None,
        "step_updates": [],
        "run_id": run_id,
        "error": None,
    }
