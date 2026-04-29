from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/discoveries", response_model=APIResponse)
async def get_discoveries():
    return APIResponse(success=True, data=[], message="No discoveries stored yet")
