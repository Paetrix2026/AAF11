import os
import tempfile
import asyncio
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
from utils.logger import get_logger
import requests
import subprocess
from pathlib import Path
from utils.docking_utils import run_vina_docking, LigandPreparer, ProteinPreparer, SCREENING_COMPOUNDS, CREATE_NO_WINDOW

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

def get_mutation_resistance(compound: str, mutation: Optional[str]) -> float:
    """Retrieve resistance score for a specific mutation if available."""
    if not mutation:
        return 0.1 # Baseline low risk

    resistance_path = Path(__file__).parent.parent / "data" / "structures" / "mutation_resistance.json"
    if not resistance_path.exists():
        return 0.1
        
    try:
        with open(resistance_path, "r") as f:
            data = json.load(f)
        
        # Standardize mutation format (strip H1N1_ prefix if any)
        clean_mut = mutation.split('_')[-1] if '_' in mutation else mutation
        
        comp_data = data.get(compound, {})
        return comp_data.get(clean_mut, 0.1)
    except Exception as e:
        logger.error(f"Error reading mutation resistance map: {e}")
        return 0.1

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
    mutation: Optional[str] = Form(None),
    pdb_file: Optional[UploadFile] = File(None)
):
    try:
        # Filter malformed PDB IDs (like AI placeholders)
        if pdb_id and ("disease_" in pdb_id or "mutation_" in pdb_id or len(pdb_id) > 15):
            logger.warning(f"Detected malformed PDB ID: {pdb_id}. Reverting to target-based resolution.")
            pdb_id = None

        # Resolve PDB ID if target is provided
        if not pdb_id and not pdb_file and target:
            pdb_id = get_pdb_id_from_target(target)
            if not pdb_id:
                # If target mapping fails, try using the target name as a fuzzy identifier for acquire_structure
                pdb_id = target
            logger.info(f"Resolved target {target} to PDB ID: {pdb_id}")

        with tempfile.TemporaryDirectory() as tmpdir:
            receptor_pdbqt = os.path.join(tmpdir, "receptor.pdbqt")
            pdb_content = ""

            # 1. Get Receptor PDB Content
            if pdb_file:
                content = await pdb_file.read()
                pdb_content = content.decode("utf-8", errors="replace")
            elif pdb_id:
                from utils.structure_utils import acquire_structure
                pdb_content = await acquire_structure(pdb_id)
                if not pdb_content:
                    raise HTTPException(status_code=404, detail=f"Structure could not be resolved for: {pdb_id}")
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

                    # Simplified Scoring (Decoupled from Pipeline Agents)
                    from utils.scoring_utils import calculate_simple_decision_score
                    
                    resistance = get_mutation_resistance(compound["name"], mutation)
                    decision_score = calculate_simple_decision_score(affinity, resistance)

                    # Convert Vina output (PDBQT) to PDB for the frontend viewer
                    from utils.environment import get_binary_path
                    obabel = get_binary_path("obabel")
                    ligand_pdb_content = None
                    if os.path.exists(output_pdbqt):
                        ligand_pdb_path = os.path.join(tmpdir, f"{compound['name']}_out.pdb")
                        # Explicitly set formats to avoid obabel guessing errors
                        conv = subprocess.run([obabel, "-ipdbqt", output_pdbqt, "-opdb", "-O", ligand_pdb_path], 
                                            capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
                        if os.path.exists(ligand_pdb_path):
                            with open(ligand_pdb_path, "r") as f:
                                ligand_pdb_content = f.read()
                        else:
                            logger.warning(f"Obabel conversion failed for {compound['name']}: {conv.stderr}")

                    results.append({
                        "name": compound["name"],
                        "smiles": compound["smiles"],
                        "affinity": affinity,
                        "seed": seed,
                        "resistance": resistance,
                        "decision_score": decision_score,
                        "status": "success",
                        "ligand_pdb": ligand_pdb_content
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
                    "mutation": mutation,
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
