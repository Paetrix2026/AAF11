from pipeline.state import PipelineState
from pipeline.planner import plan_agents
from utils.logger import get_logger

logger = get_logger("PlannerAgent")


def run(state: PipelineState) -> PipelineState:
    logger.info(f"Planning pipeline for pathogen: {state['pathogen']}")
    agents = plan_agents(state)
    state["step_updates"].append(f"PlannerAgent:running:Planning analysis for {state['pathogen']}")
    state["step_updates"].append(f"PlannerAgent:complete:Scheduled {len(agents)} agents")
    return state
