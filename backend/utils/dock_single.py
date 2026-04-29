import shutil
from typing import Dict, Optional
from utils.logger import get_logger
from utils.workspace import create_workspace, get_workspace_files
from utils.ligand_prep import prepare_ligand
from utils.pdbqt_converter import convert_to_pdbqt
from utils.vina_runner import run_vina
from utils.vina_parser import parse_vina_output

logger = get_logger("dock_single")


def dock_single_ligand(
    smiles: str,
    receptor_pdbqt: str,
    grid_config: Dict[str, float]
) -> Dict:
    """
    Complete docking workflow for a single ligand.
    
    Orchestrates the full pipeline:
    1. Create isolated workspace
    2. Prepare ligand from SMILES → PDB
    3. Convert PDB → PDBQT
    4. Run AutoDock Vina
    5. Parse binding affinity
    
    Args:
        smiles: SMILES string of the drug/ligand
        receptor_pdbqt: Path to prepared receptor PDBQT file
        grid_config: Dict with center_x/y/z and size_x/y/z
        
    Returns:
        Dict with keys:
            - "smiles": str (input SMILES)
            - "affinity": float or None (binding affinity in kcal/mol)
            - "status": "success" | "prep_failed" | "vina_failed"
    """
    workspace = None
    
    try:
        # Step 1: Create workspace
        workspace = create_workspace()
        files = get_workspace_files(workspace)
        logger.info(f"Docking: {smiles[:30]}...")
        
        # Step 2: Prepare ligand from SMILES
        ligand_pdb = prepare_ligand(smiles, files["ligand_pdb"])
        if not ligand_pdb:
            logger.error(f"Ligand prep failed: {smiles}")
            return {
                "smiles": smiles,
                "affinity": None,
                "status": "prep_failed"
            }
        
        # Step 3: Convert PDB → PDBQT
        pdbqt_success = convert_to_pdbqt(files["ligand_pdb"], files["ligand_pdbqt"])
        if not pdbqt_success:
            logger.error(f"PDBQT conversion failed: {smiles}")
            return {
                "smiles": smiles,
                "affinity": None,
                "status": "prep_failed"
            }
        
        # Step 4: Run Vina
        stdout = run_vina(
            receptor_pdbqt,
            files["ligand_pdbqt"],
            grid_config,
            files["output_pdbqt"]
        )
        
        if not stdout:
            logger.error(f"Vina failed: {smiles}")
            return {
                "smiles": smiles,
                "affinity": None,
                "status": "vina_failed"
            }
        
        # Step 5: Parse output
        affinity, seed = parse_vina_output(stdout)
        
        if affinity is None:
            logger.warning(f"No affinity found: {smiles}")
            return {
                "smiles": smiles,
                "affinity": None,
                "status": "vina_failed"
            }
        
        logger.info(f"✓ Docking successful: {smiles} → {affinity:.2f} kcal/mol")
        
        return {
            "smiles": smiles,
            "affinity": affinity,
            "status": "success"
        }
    
    except Exception as e:
        logger.error(f"Unexpected error during docking: {e}")
        return {
            "smiles": smiles,
            "affinity": None,
            "status": "prep_failed"  # Generic error caught
        }
    
    finally:
        # Cleanup workspace
        if workspace:
            try:
                shutil.rmtree(workspace)
                logger.debug(f"Cleaned workspace: {workspace}")
            except Exception as e:
                logger.warning(f"Failed to cleanup workspace: {e}")
