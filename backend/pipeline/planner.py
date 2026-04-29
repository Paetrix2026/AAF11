import json
from typing import List
from pipeline.state import PipelineState
from utils.llm_router import get_llm
from utils.logger import get_logger

logger = get_logger("Planner")

PLANNER_PROMPT = """You are a molecular biology pipeline architect. 
Given a pathogen name and an optional user query, determine which specialized agents should be executed.

Available Agents:
- FetchAgent: Retrieves sequences from NCBI.
- MutationParserAgent: Aligns sequences and identifies variants.
- StructurePrepAgent: Prepares 3D protein structure.
- DockingAgent: Performs molecular docking simulation.
- ADMETAgent: Predicts drug properties.
- ResistanceAgent: Analyzes known resistance mutations.
- SelectivityAgent: Checks off-target binding risks.
- SimilaritySearchAgent: Finds historical cases in clinical database.
- PrecisionMedicineAgent: Analyzes patient-specific genetic markers (run if query mentions 'genetics', 'marker', 'patient-specific').
- ExplainabilityAgent: AI synthesis of all results.
- ReportAgent: Final structured report generation.

Pathogen: {pathogen}
User Query: {query}

Return ONLY a JSON array of strings representing the agent names in execution order.
Always include FetchAgent, MutationParserAgent, ExplainabilityAgent, and ReportAgent.
Include docking/structure agents if the pathogen is a virus or bacteria that can be modeled.

Example Output: ["FetchAgent", "MutationParserAgent", "StructurePrepAgent", "DockingAgent", "ExplainabilityAgent", "ReportAgent"]
Respond ONLY with the JSON array."""

def plan_agents(state: PipelineState) -> List[str]:
    """Determine which agents to run using Groq for rapid, intelligent routing."""
    try:
        # Default agents that always run
        default_agents = ["FetchAgent", "MutationParserAgent", "StructurePrepAgent", "DockingAgent", "ADMETAgent", "ResistanceAgent", "SelectivityAgent", "SimilaritySearchAgent", "ExplainabilityAgent", "ReportAgent"]
        
        pathogen = state.get("pathogen", "Unknown")
        query = state.get("user_query", "")

        llm = get_llm(provider="groq")
        prompt = PLANNER_PROMPT.format(pathogen=pathogen, query=query)
        
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Cleanup JSON
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        agents = json.loads(content)
        
        if not isinstance(agents, list) or len(agents) == 0:
            return default_agents
            
        logger.info(f"Intelligent Planner scheduled: {agents}")
        return agents
    except Exception as e:
        logger.warning(f"Intelligent planning failed ({e}), falling back to default pipeline")
        return ["FetchAgent", "MutationParserAgent", "StructurePrepAgent", "DockingAgent", "ADMETAgent", "ResistanceAgent", "SelectivityAgent", "SimilaritySearchAgent", "ExplainabilityAgent", "ReportAgent"]
