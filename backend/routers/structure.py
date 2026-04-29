import requests
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class APIResponse(BaseModel):
    success: bool
    data: object
    message: str


@router.get("/structure", response_model=APIResponse)
async def get_structure(pdb_id: str = ""):
    if not pdb_id:
        return APIResponse(success=False, data=None, message="pdb_id is required")
    try:
        url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return APIResponse(success=True, data={"pdb_id": pdb_id, "pdb_data": resp.text}, message="OK")
        return APIResponse(success=False, data=None, message=f"PDB {pdb_id} not found")
    except Exception as e:
        return APIResponse(success=False, data=None, message=str(e))
