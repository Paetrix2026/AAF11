from fastapi import APIRouter
from pydantic import BaseModel
from utils.system_check import check_vina, check_obabel, check_mafft

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/status", response_model=APIResponse)
async def get_status():
    return APIResponse(
        success=True,
        data={
            "status": "ok",
            "binaries": {
                "vina": check_vina(),
                "obabel": check_obabel(),
                "mafft": check_mafft(),
            },
        },
        message="System operational",
    )
