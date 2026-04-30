from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.db import get_pool

logger = get_logger("SimilaritySearchAgent")


async def fetch_similar_cases(patient_id: str, pathogen: str) -> list:
    """Fetch similar historical cases from the database."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Query pipeline_runs and outcomes to find similar pathogens
            rows = await conn.fetch(
                """
                SELECT o.id, o.recommended_drug, o.outcome, o.created_at
                FROM outcomes o
                JOIN pipeline_runs pr ON o.run_id = pr.id
                WHERE pr.pathogen ILIKE $1
                  AND (o.patient_id IS NULL OR o.patient_id != $2::uuid)
                  AND o.outcome IS NOT NULL
                ORDER BY o.created_at DESC
                LIMIT 4
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


async def run(state: PipelineState) -> PipelineState:
    """Fetches real historical data from previous clinical outcomes."""
    state["step_updates"].append("SimilaritySearchAgent:running:Searching historical cases...")
    
    patient_id = state.get("patient_id")
    pathogen = state.get("pathogen", "Unknown")
    
    cases = await fetch_similar_cases(patient_id, pathogen)
    state["similar_cases"] = cases
    
    state["step_updates"].append(f"SimilaritySearchAgent:complete:Found {len(cases)} similar case(s)")
    return state
