import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.jwt import decode_token
from utils.db import get_pool
from routers.analysis import _runs

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.get("/export")
async def export_report(
    run_id: str,
    current_user: dict = Depends(get_current_user),
):
    if not run_id:
        raise HTTPException(status_code=400, detail="run_id is required")

    result_data = None

    # Check in-memory store first
    if run_id in _runs and _runs[run_id].get("result") is not None:
        result_data = _runs[run_id]["result"]
    else:
        # Fall back to DB
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
                result_data = json.loads(result_val)
            except Exception:
                result_data = result_val
        else:
            result_data = result_val

    pretty_json = json.dumps(result_data, indent=2, default=str)
    filename = f"healynx-report-{run_id}.json"

    return StreamingResponse(
        iter([pretty_json]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )
