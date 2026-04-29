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
    smiles: Optional[str] = Form(None),
    center_x: float = Form(0.0),
    center_y: float = Form(0.0),
    center_z: float = Form(0.0),
    size_x: float = Form(30.0),
    size_y: float = Form(30.0),
    size_z: float = Form(30.0),
    exhaustiveness: int = Form(8),
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

            # 2. Prepare Receptor
            protein_prep = ProteinPreparer()
            await protein_prep.prepare(pdb_content, pdb_id or "uploaded", tmpdir)
            actual_receptor_path = os.path.join(tmpdir, f"{pdb_id or 'uploaded'}_receptor.pdbqt")
            
            # Use centered PDB for frontend viewer to match docking coordinates
            centered_pdb_path = os.path.join(tmpdir, f"{pdb_id or 'uploaded'}_centered.pdb")
            if os.path.exists(centered_pdb_path):
                with open(centered_pdb_path, "r") as f:
                    pdb_content = f.read()

            # 3. Docking (Single or Screening)
            results = []
            compounds_to_dock = []
            if smiles:
                compounds_to_dock = [{"name": "Manual", "smiles": smiles}]
            else:
                compounds_to_dock = SCREENING_COMPOUNDS

            preparer = LigandPreparer()
            for compound in compounds_to_dock:
                ligand_pdbqt = os.path.join(tmpdir, f"{compound['name']}.pdbqt")
                output_pdbqt = os.path.join(tmpdir, f"{compound['name']}_out.pdbqt")
                
                try:
                    preparer.prepare(compound["smiles"], ligand_pdbqt)
                    
                    # Run Docking via threadpool to avoid blocking event loop
                    from starlette.concurrency import run_in_threadpool
                    affinity, seed = await run_in_threadpool(
                        run_vina_docking,
                        receptor_path=actual_receptor_path,
                        ligand_path=ligand_pdbqt,
                        output_path=output_pdbqt,
                        center=(center_x, center_y, center_z),
                        size=(size_x, size_y, size_z),
                        exhaustiveness=exhaustiveness
                    )

                    # Integrated Intelligence Scoring
                    from agents.ResistanceAgent import score_resistance, load_resistance_data
                    from agents.DecisionAgent import DecisionAgent
                    
                    resistance_data = load_resistance_data()
                    typical_mutations = []
                    try:
                        profiles_path = os.path.join(os.path.dirname(__file__), "..", "data", "structures", "curated_profiles.json")
                        with open(profiles_path) as f:
                            profiles = json.load(f)
                            typical_mutations = profiles.get(target, {}).get("typical_resistance_mutations", [])
                    except:
                        pass
                    
                    resistance = score_resistance(typical_mutations, compound["name"], resistance_data)
                    
                    # Decision Scoring
                    decision_agent = DecisionAgent()
                    decision_data = {
                        "name": compound["name"],
                        "binding": affinity if affinity is not None else -4.0,
                        "resistance": resistance,
                        "patient_risk": 0.5 # Default baseline
                    }
                    ranked_results = decision_agent.run([decision_data])
                    decision_score = ranked_results[0]["decision_score"] if ranked_results else 0

                    results.append({
                        "name": compound["name"],
                        "smiles": compound["smiles"],
                        "affinity": affinity,
                        "seed": seed,
                        "resistance": resistance,
                        "decision_score": decision_score,
                        "status": "success",
                        "ligand_pdb": open(ligand_pdbqt, "r").read() if os.path.exists(ligand_pdbqt) else None
                    })
                except Exception as e:
                    logger.error(f"Compound {compound['name']} failed: {e}")
                    results.append({
                        "name": compound["name"],
                        "smiles": compound["smiles"],
                        "affinity": None,
                        "status": "failed",
                        "error": str(e)
                    })

            # Return results
            return APIResponse(
                success=True,
                data={
                    "results": results,
                    "pdb_id": pdb_id,
                    "target": target,
                    "pdb_content": pdb_content,
                },
                message="Molecular docking screening process finished. Check individual compound status for failures."
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STRICT_PIPELINE_ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"STRICT_PIPELINE_ERROR: {str(e)}")

@router.get("/screening-compounds", response_model=APIResponse)
async def get_screening_compounds():
    return APIResponse(success=True, data=SCREENING_COMPOUNDS, message="OK")
