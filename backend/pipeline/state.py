from typing import TypedDict, List, Optional


class PipelineState(TypedDict):
    patient_id: str
    pathogen: str
    variant: Optional[str]
    symptoms: Optional[List[str]]
    sequences: Optional[List[str]]
    mutations: Optional[List[str]]
    structure_pdb: Optional[str]
    docking_results: Optional[List[dict]]
    admet_scores: Optional[dict]
    resistance_scores: Optional[dict]
    selectivity_scores: Optional[dict]
    similar_cases: Optional[List[dict]]
    recommendation: Optional[dict]
    plain_summary: Optional[str]
    urgency: Optional[str]
    risk_level: Optional[str]
    report: Optional[str]
    step_updates: List[str]
    run_id: Optional[str]
    error: Optional[str]
