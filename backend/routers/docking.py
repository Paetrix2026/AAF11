import os
import tempfile
import asyncio
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from utils.docking_utils import run_vina_docking, LigandPreparer, ProteinPreparer, SCREENING_COMPOUNDS
from utils.logger import get_logger
import requests
from pathlib import Path

router = APIRouter()
logger = get_logger("docking_router")

# Path to the local target-to-PDB mapping database
PDB_MAP_PATH = Path(__file__).parent.parent / "data" / "structures" / "target_pdb_map.json"

class APIResponse(BaseModel):
    success: bool
    data: object
    message: str

def get_pdb_id_from_target(target: str) -> Optional[str]:
    """Retrieve PDB ID from the local JSON database."""
    if not PDB_MAP_PATH.exists():
        return None
    try:
        with open(PDB_MAP_PATH, "r") as f:
            mapping = json.load(f)
        return mapping.get(target) or mapping.get(target.title())
    except Exception as e:
        logger.error(f"Error reading PDB map: {e}")
        return None

@router.post("/dock", response_model=APIResponse)
async def perform_docking(
    pdb_id: Optional[str] = Form(None),
    target: Optional[str] = Form(None),
    smiles: str = Form(...),
    center_x: float = Form(0.0),
    center_y: float = Form(0.0),
    center_z: float = Form(0.0),
    size_x: float = Form(30.0),
    size_y: float = Form(30.0),
    size_z: float = Form(30.0),
    pdb_file: Optional[UploadFile] = File(None)
):
    try:
        # Resolve PDB ID if target is provided
        if not pdb_id and not pdb_file and target:
            pdb_id = get_pdb_id_from_target(target)
            if not pdb_id:
                raise HTTPException(status_code=404, detail=f"No PDB mapping found for target: {target}")
            logger.info(f"Resolved target {target} to PDB ID: {pdb_id}")

        with tempfile.TemporaryDirectory() as tmpdir:
            receptor_pdbqt = os.path.join(tmpdir, "receptor.pdbqt")
            ligand_pdbqt = os.path.join(tmpdir, "ligand.pdbqt")
            output_pdbqt = os.path.join(tmpdir, "output.pdbqt")
            
            pdb_content = ""

            # 1. Get Receptor PDB Content
            if pdb_file:
                content = await pdb_file.read()
                pdb_content = content.decode("utf-8", errors="replace")
            elif pdb_id:
                url = f"https://files.rcsb.org/download/{pdb_id.upper()}.pdb"
                resp = requests.get(url, timeout=30)
                if resp.status_code != 200:
                    raise HTTPException(status_code=404, detail=f"PDB {pdb_id} not found in RCSB")
                pdb_content = resp.text
            else:
                raise HTTPException(status_code=400, detail="Either pdb_id, target, or pdb_file must be provided")

            # 2. Prepare Receptor (Production-Grade)
            protein_prep = ProteinPreparer()
            try:
                # We use the current directory or tmpdir for the PDBQT output
                await protein_prep.prepare(pdb_content, pdb_id or "uploaded", tmpdir)
                # The preparer saves to {pdb_id}_receptor.pdbqt
                actual_receptor_path = os.path.join(tmpdir, f"{pdb_id or 'uploaded'}_receptor.pdbqt")
            except Exception as e:
                logger.error(f"Receptor preparation failed: {e}")
                raise HTTPException(status_code=500, detail=f"Receptor preparation failed: {str(e)}")

            # 3. Prepare Ligand
            preparer = LigandPreparer()
            if not preparer.prepare(smiles, ligand_pdbqt):
                raise HTTPException(status_code=500, detail="Ligand preparation failed")

            # 4. Run Docking with Vina
            affinity = run_vina_docking(
                actual_receptor_path, ligand_pdbqt, output_pdbqt,
                center=(center_x, center_y, center_z),
                size=(size_x, size_y, size_z)
            )

            if affinity is None:
                raise HTTPException(status_code=500, detail="Docking simulation failed. Ensure Vina and OpenBabel are installed.")

            return APIResponse(
                success=True,
                data={
                    "affinity": affinity,
                    "pdb_id": pdb_id,
                    "target": target,
                    "smiles": smiles,
                    "binding_energy": f"{affinity} kcal/mol",
                    "pdb_content": pdb_content,
                    "docked_pdb": open(output_pdbqt, "r").read() if os.path.exists(output_pdbqt) else None
                },
                message="Molecular docking completed successfully using AutoDock Vina."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Standalone docking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/screening-compounds", response_model=APIResponse)
async def get_screening_compounds():
    return APIResponse(success=True, data=SCREENING_COMPOUNDS, message="OK")
