from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_theme_store: dict = {}


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/themes", response_model=APIResponse)
async def get_themes():
    return APIResponse(success=True, data=_theme_store, message="OK")


@router.post("/themes", response_model=APIResponse)
async def save_themes(data: dict):
    _theme_store.update(data)
    return APIResponse(success=True, data=_theme_store, message="Saved")
