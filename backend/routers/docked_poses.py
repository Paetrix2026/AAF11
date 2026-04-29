from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/docked-poses", response_model=APIResponse)
async def get_docked_poses():
    return APIResponse(success=True, data=[], message="No docked poses stored yet")
