from typing import List
from pipeline.state import PipelineState


def plan_agents(state: PipelineState) -> List[str]:
    """Determine which agents to run based on available inputs."""
    agents = ["FetchAgent", "MutationParserAgent"]

    # Structure and docking if pathogen is known
    agents.extend(["StructurePrepAgent", "DockingAgent"])

    # Always run ADMET, resistance, selectivity
    agents.extend(["ADMETAgent", "ResistanceAgent", "SelectivityAgent"])

    # Memory and synthesis
    agents.extend(["SimilaritySearchAgent", "ExplainabilityAgent", "ReportAgent"])

    return agents
