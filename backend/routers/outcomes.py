import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from utils.db import get_pool
from auth.jwt import decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


class OutcomeRequest(BaseModel):
    runId: str
    outcome: str          # "effective" | "partial" | "failed"
    notes: Optional[str] = ""


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.post("/outcome", response_model=APIResponse)
async def submit_outcome(req: OutcomeRequest, current_user: dict = Depends(get_current_user)):
    """Record a clinical outcome observation for a completed pipeline run."""
    if req.outcome not in ("effective", "partial", "failed"):
        raise HTTPException(status_code=400, detail="outcome must be 'effective', 'partial', or 'failed'")

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Fetch the run to get patient_id and primary drug from result
        run = await conn.fetchrow(
            "SELECT patient_id, result FROM pipeline_runs WHERE id = $1::uuid",
            req.runId,
        )
        if not run:
            raise HTTPException(status_code=404, detail="Pipeline run not found")

        patient_id = run["patient_id"]
        result_data = run["result"]

        # Extract recommended drug from result JSON
        recommended_drug = None
        if result_data:
            try:
                rd = result_data if isinstance(result_data, dict) else json.loads(result_data)
                recommended_drug = rd.get("primaryDrug") or rd.get("report", {}).get("primaryDrug")
            except Exception:
                pass

        # Map outcome text to numeric score
        score_map = {"effective": 100, "partial": 50, "failed": 0}
        outcome_score = score_map.get(req.outcome, 0)

        # Check for existing outcome for this run
        existing = await conn.fetchrow(
            "SELECT id FROM outcomes WHERE run_id = $1::uuid", req.runId
        )
        if existing:
            row = await conn.fetchrow(
                """
                UPDATE outcomes
                SET outcome=$1, outcome_score=$2, notes=$3, resolved_at=NOW()
                WHERE run_id=$4::uuid
                RETURNING id, outcome, outcome_score
                """,
                req.outcome, outcome_score, req.notes or "", req.runId,
            )
        else:
            row = await conn.fetchrow(
                """
                INSERT INTO outcomes
                    (run_id, patient_id, recommended_drug, outcome, outcome_score, notes)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
                RETURNING id, outcome, outcome_score
                """,
                req.runId,
                str(patient_id),
                recommended_drug,
                req.outcome,
                outcome_score,
                req.notes or "",
            )

    return APIResponse(
        success=True,
        data={
            "id": str(row["id"]),
            "outcome": row["outcome"],
            "outcomeScore": row["outcome_score"],
            "runId": req.runId,
        },
        message="Outcome recorded successfully",
    )
