import asyncio
import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pipeline.graph import build_pipeline_graph
from pipeline.state import PipelineState
from utils.db import get_pool
from utils.logger import get_logger
from auth.jwt import decode_token
from agents.SimilaritySearchAgent import fetch_similar_cases

router = APIRouter()
security = HTTPBearer(auto_error=False)
logger = get_logger("analysis")

# In-memory run store (replace with Redis in production)
_runs: dict[str, dict] = {}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


class AnalyzeRequest(BaseModel):
    patientId: str
    pathogen: str
    variant: Optional[str] = None
    symptoms: Optional[List[str]] = None
    overrideMutations: Optional[List[str]] = None


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.post("/analyze", response_model=APIResponse)
async def start_analysis(req: AnalyzeRequest, current_user: dict = Depends(get_current_user)):
    run_id = str(uuid.uuid4())
    pool = await get_pool()

    # Verify patient exists
    async with pool.acquire() as conn:
        patient = await conn.fetchrow(
            "SELECT id FROM patients WHERE id = $1::uuid", req.patientId
        )
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Create pipeline run record
        await conn.fetchrow(
            """
            INSERT INTO pipeline_runs (id, patient_id, doctor_id, pathogen, variant, status)
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'running')
            RETURNING id
            """,
            run_id, req.patientId, current_user["sub"], req.pathogen, req.variant,
        )

    _runs[run_id] = {
        "status": "running",
        "steps": [],
        "result": None,
    }

    # Run pipeline in background
    asyncio.create_task(run_pipeline_task(
        run_id=run_id,
        patient_id=req.patientId,
        doctor_id=current_user["sub"],
        pathogen=req.pathogen,
        variant=req.variant,
        symptoms=req.symptoms or [],
        pool=pool,
    ))

    return APIResponse(success=True, data={"runId": run_id}, message="Pipeline started")


async def run_pipeline_task(
    run_id: str,
    patient_id: str,
    doctor_id: str,
    pathogen: str,
    variant: Optional[str],
    symptoms: List[str],
    pool,
) -> None:
    """Run the LangGraph pipeline asynchronously."""
    try:
        graph = build_pipeline_graph()

        initial_state: PipelineState = {
            "patient_id": patient_id,
            "pathogen": pathogen,
            "variant": variant,
            "symptoms": symptoms,
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

        # Fetch similar cases before running graph (async DB call)
        similar_cases = await fetch_similar_cases(patient_id, pathogen, pool)
        initial_state["similar_cases"] = similar_cases

        # Run asynchronously
        final_state = await graph.ainvoke(initial_state)

        # Parse report
        result = json.loads(final_state.get("report") or "{}")

        # Store step updates and result
        _runs[run_id]["steps"] = final_state.get("step_updates", [])
        _runs[run_id]["result"] = result
        _runs[run_id]["status"] = "complete"

        # Update DB
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE pipeline_runs SET status='complete', result=$1::jsonb WHERE id=$2::uuid",
                json.dumps(result), run_id,
            )
    except Exception as e:
        logger.error(f"Pipeline task failed for run {run_id}: {e}")
        _runs[run_id]["status"] = "failed"
        _runs[run_id]["error"] = str(e)
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE pipeline_runs SET status='failed' WHERE id=$1::uuid",
                run_id,
            )


@router.post("/outcome", response_model=APIResponse)
async def submit_outcome(
    data: dict,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    run_id = data.get("runId")
    outcome = data.get("outcome")
    notes = data.get("notes", "")

    if not run_id or not outcome:
        raise HTTPException(status_code=400, detail="runId and outcome are required")

    async with pool.acquire() as conn:
        run = await conn.fetchrow(
            "SELECT patient_id, result FROM pipeline_runs WHERE id=$1::uuid", run_id
        )
        if not run:
            raise HTTPException(status_code=404, detail="Pipeline run not found")

        result_data = run["result"] or {}
        recommended_drug = result_data.get("primaryDrug") if isinstance(result_data, dict) else None

        row = await conn.fetchrow(
            """
            INSERT INTO outcomes (run_id, patient_id, recommended_drug, outcome, notes)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5)
            RETURNING id
            """,
            run_id, str(run["patient_id"]), recommended_drug, outcome, notes,
        )

    return APIResponse(success=True, data={"id": str(row["id"])}, message="Outcome recorded")


@router.get("/pipeline/runs", response_model=APIResponse)
async def get_pipeline_runs(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        if patient_id:
            rows = await conn.fetch(
                "SELECT * FROM pipeline_runs WHERE patient_id=$1::uuid ORDER BY created_at DESC LIMIT 20",
                patient_id,
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM pipeline_runs WHERE doctor_id=$1::uuid ORDER BY created_at DESC LIMIT 20",
                current_user["sub"],
            )

    runs = []
    for row in rows:
        r = dict(row)
        r["id"] = str(r["id"])
        r["patientId"] = str(r.pop("patient_id"))
        r["doctorId"] = str(r.pop("doctor_id"))
        if r.get("created_at"):
            r["createdAt"] = r.pop("created_at").isoformat()
        runs.append(r)

    return APIResponse(success=True, data=runs, message="OK")
