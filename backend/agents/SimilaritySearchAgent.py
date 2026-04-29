from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("SimilaritySearchAgent")


async def fetch_similar_cases(patient_id: str, pathogen: str, pool) -> list:
    """Fetch similar historical cases from the database."""
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT o.id, o.recommended_drug, o.outcome, o.created_at,
                       pr.pathogen
                FROM outcomes o
                JOIN pipeline_runs pr ON o.run_id = pr.id
                WHERE pr.pathogen ILIKE $1
                  AND o.patient_id != $2::uuid
                  AND o.outcome IS NOT NULL
                LIMIT 5
                """,
                f"%{pathogen}%",
                patient_id,
            )
            return [
                {
                    "caseId": f"CASE-{str(row['id'])[:8].upper()}",
                    "drug": row["recommended_drug"] or "Unknown",
                    "outcome": row["outcome"],
                    "date": row["created_at"].strftime("%Y-%m-%d") if row["created_at"] else "—",
                }
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Similar cases fetch failed: {e}")
        return []


def run(state: PipelineState) -> PipelineState:
    """Synchronous wrapper — async DB call happens in orchestrator."""
    state["step_updates"].append("SimilaritySearchAgent:running:Searching historical cases...")
    # Similar cases are fetched asynchronously in OrchestratorAgent
    # This agent sets a placeholder; OrchestratorAgent fills it
    if state.get("similar_cases") is None:
        state["similar_cases"] = []
    state["step_updates"].append(f"SimilaritySearchAgent:complete:Found {len(state['similar_cases'])} similar case(s)")
    return state
