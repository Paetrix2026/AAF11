import tempfile
import os
from typing import Dict
from utils.logger import get_logger

logger = get_logger("workspace")


def create_workspace() -> str:
    """
    Create an isolated temporary workspace directory for a docking run.
    
    Each call generates a unique directory. The caller is responsible
    for cleanup after use.
    
    Returns:
        str: Path to temporary workspace directory
    """
    tmpdir = tempfile.mkdtemp(prefix="docking_", suffix="_workspace")
    logger.info(f"✓ Created workspace: {tmpdir}")
    return tmpdir


def get_workspace_files(tmpdir: str) -> Dict[str, str]:
    """
    Get standard file paths for a workspace directory.
    
    Provides consistent naming for ligand and receptor files within
    a workspace, ensuring all runs have the same structure.
    
    Args:
        tmpdir: Workspace directory path (from create_workspace())
        
    Returns:
        Dict with keys:
            - "ligand_pdb": Path to ligand PDB file
            - "ligand_pdbqt": Path to ligand PDBQT file
            - "output_pdbqt": Path to docked output file
    """
    files = {
        "ligand_pdb": os.path.join(tmpdir, "ligand.pdb"),
        "ligand_pdbqt": os.path.join(tmpdir, "ligand.pdbqt"),
        "output_pdbqt": os.path.join(tmpdir, "output.pdbqt"),
    }
    
    logger.info(f"Workspace files in {tmpdir}:")
    for key, path in files.items():
        logger.info(f"  {key}: {path}")
    
    return files
