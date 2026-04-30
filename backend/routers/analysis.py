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

    # Validate UUID format
    try:
        uuid.UUID(req.patientId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

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
        symptoms=req.symptoms if req.symptoms is not None else [],
        pool=pool,
    ))

    return {
        "success": True,
        "data": {"runId": run_id},
        "message": "Analysis started",
    }


async def run_pipeline_task(
    run_id: str,
    patient_id: str,
    doctor_id: str,
    pathogen: str,
    variant: Optional[str],
    symptoms: List[str],
    pool,
):
    try:
        app = build_pipeline_graph()
        initial_state: PipelineState = {
            "patient_id": patient_id,
            "pathogen": pathogen,
            "variant": variant,
            "symptoms": symptoms,
            "sequences": [],
            "mutations": [],
            "structure_pdb": None,
            "structure_pdbqt": None,
            "docking_results": [],
            "admet_scores": {},
            "resistance_scores": {},
            "selectivity_scores": {},
            "similar_cases": [],
            "recommendation": {},
            "step_updates": [],
            "report": None,
            "run_id": run_id,
        }

        final_state = initial_state
        async for state in app.astream(initial_state, stream_mode="values"):
            if state:
                final_state = state
                # Update memory store for SSE
                if "step_updates" in state and state["step_updates"]:
                    # Always sync the entire list to the in-memory run
                    _runs[run_id]["steps"] = state["step_updates"]
                    if state["step_updates"]:
                        _runs[run_id]["message"] = state["step_updates"][-1]

        _runs[run_id]["status"] = "completed"
        _runs[run_id]["result"] = final_state.get("report") or final_state

        # Update DB
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE pipeline_runs SET status = 'completed', result = $1::jsonb WHERE id = $2::uuid",
                json.dumps(final_state),
                run_id,
            )

        # Send Telegram alerts
        try:
            from telegram.bot import send_doctor_alert, send_patient_alert
            pool2 = await get_pool()
            async with pool2.acquire() as conn:
                doctor_row = await conn.fetchrow(
                    "SELECT telegram_handle, alert_opt_in FROM users WHERE id = $1::uuid",
                    doctor_id,
                )
                patient_row = await conn.fetchrow(
                    "SELECT name FROM patients WHERE id = $1::uuid",
                    patient_id,
                )

            report = final_state.get("report") or {}
            primary_drug = report.get("primaryDrug", "Unknown") if isinstance(report, dict) else "Unknown"
            risk_level = report.get("riskLevel", "unknown") if isinstance(report, dict) else "unknown"
            patient_name = patient_row["name"] if patient_row else "Patient"

            if doctor_row and doctor_row["telegram_handle"] and doctor_row["alert_opt_in"]:
                await send_doctor_alert(
                    telegram_handle=doctor_row["telegram_handle"],
                    patient_name=patient_name,
                    risk_level=risk_level,
                    drug=primary_drug,
                )

            # Also notify family channel
            from telegram.bot import send_family_channel_update
            report_dict = final_state.get("report") or {}
            if isinstance(report_dict, dict):
                sim_results = final_state.get("simulation_results") or []
                top_sim = sim_results[0] if sim_results else {}
                await send_family_channel_update(
                    patient_name=patient_name,
                    primary_drug=report_dict.get("primaryDrug", primary_drug),
                    predicted_outcome=top_sim.get("predicted_outcome", "unknown"),
                    time_to_failure=top_sim.get("time_to_failure", "N/A"),
                    risk_level=report_dict.get("riskLevel", risk_level),
                    patient_summary=report_dict.get("patientSummary", "Analysis complete."),
                    action_required=report_dict.get("actionRequired", "Follow up with your doctor."),
                    pathogen=pathogen,
                )
        except Exception as tg_err:
            logger.warning(f"Telegram alert failed: {tg_err}")

    except Exception as e:
        logger.error(f"Pipeline error for run {run_id}: {str(e)}")
        _runs[run_id]["status"] = "failed"
        _runs[run_id]["message"] = str(e)

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE pipeline_runs SET status = 'failed' WHERE id = $1::uuid",
                run_id,
            )


@router.get("/runs", response_model=APIResponse)
async def list_pipeline_runs(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        role = current_user.get("role", "doctor")

        # ── Patient calling their own runs ────────────────────────────
        if role == "patient" and not patient_id:
            # Look up the patient record linked to this user account
            patient_row = await conn.fetchrow(
                "SELECT id FROM patients WHERE user_id = $1::uuid",
                current_user["sub"],
            )
            if not patient_row:
                return {"success": True, "data": [], "message": "No patient record linked to this account"}
            patient_id = str(patient_row["id"])

        if patient_id:
            try:
                uuid.UUID(patient_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid patient_id format")
            rows = await conn.fetch(
                """
                SELECT id, patient_id, doctor_id, pathogen, variant, status, result, created_at
                FROM pipeline_runs
                WHERE patient_id = $1::uuid
                ORDER BY created_at DESC
                LIMIT 20
                """,
                patient_id,
            )
        else:
            # Doctor fetching their own patients' runs
            rows = await conn.fetch(
                """
                SELECT id, patient_id, doctor_id, pathogen, variant, status, result, created_at
                FROM pipeline_runs
                WHERE doctor_id = $1::uuid
                ORDER BY created_at DESC
                LIMIT 20
                """,
                current_user["sub"],
            )

    runs = []
    for row in rows:
        result_val = row["result"]
        if isinstance(result_val, str):
            try:
                result_val = json.loads(result_val)
            except Exception:
                pass
        runs.append({
            "id": str(row["id"]),
            "patientId": str(row["patient_id"]),
            "doctorId": str(row["doctor_id"]),
            "pathogen": row["pathogen"],
            "variant": row["variant"],
            "status": row["status"],
            "result": result_val,
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        })

    return {
        "success": True,
        "data": runs,
        "message": f"{len(runs)} run(s) found",
    }


@router.get("/result/{run_id}", response_model=APIResponse)
async def get_pipeline_result(
    run_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Check in-memory store first
    if run_id in _runs and _runs[run_id].get("result") is not None:
        return {
            "success": True,
            "data": _runs[run_id]["result"],
            "message": "Result found in memory",
        }

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT result FROM pipeline_runs WHERE id = $1::uuid",
            run_id,
        )

    if not row:
        raise HTTPException(status_code=404, detail="Run not found")

    result_val = row["result"]
    if result_val is None:
        raise HTTPException(status_code=404, detail="Result not yet available")
    if isinstance(result_val, str):
        try:
            result_val = json.loads(result_val)
        except Exception:
            pass

    return {
        "success": True,
        "data": result_val,
        "message": "Result found",
    }


@router.get("/status/{run_id}", response_model=APIResponse)
async def get_run_status(run_id: str):
    if run_id not in _runs:
        # Check DB if not in memory
        pool = await get_pool()
        async with pool.acquire() as conn:
            run = await conn.fetchrow(
                "SELECT * FROM pipeline_runs WHERE id = $1::uuid", run_id
            )
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")
            return {
                "success": True,
                "data": {
                    "status": run["status"],
                    "result": json.loads(run["result"]) if run["result"] else None,
                },
                "message": "Run found in database",
            }

    return {
        "success": True,
        "data": _runs[run_id],
        "message": "Run found in memory",
    }
