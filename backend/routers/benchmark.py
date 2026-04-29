from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.post("/benchmark", response_model=APIResponse)
async def run_benchmark():
    return APIResponse(success=True, data={"message": "Benchmark not yet implemented"}, message="OK")
