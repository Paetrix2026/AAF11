from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/molecules", response_model=APIResponse)
async def get_molecules():
    return APIResponse(success=True, data=[], message="No molecules stored yet")
