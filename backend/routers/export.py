from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/export", response_model=APIResponse)
async def export_report(run_id: str = ""):
    return APIResponse(success=True, data={"message": "Export not yet implemented"}, message="OK")
