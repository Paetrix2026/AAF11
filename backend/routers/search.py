from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/search", response_model=APIResponse)
async def search(q: str = ""):
    return APIResponse(success=True, data=[], message="No results")
