import subprocess
import os
import platform
from typing import Optional, Dict
from utils.logger import get_logger

logger = get_logger("vina_runner")

# Windows subprocess flag to prevent cmd window spawning
CREATE_NO_WINDOW = 0x08000000 if platform.system() == "Windows" else 0


def run_vina(
    receptor_pdbqt: str,
    ligand_pdbqt: str,
    grid_config: Dict[str, float],
    output_pdbqt: str
) -> Optional[str]:
    """
    Run AutoDock Vina for molecular docking.
    
    Args:
        receptor_pdbqt: Path to receptor PDBQT file
        ligand_pdbqt: Path to ligand PDBQT file
        grid_config: Dict with keys: center_x, center_y, center_z, size_x, size_y, size_z
        output_pdbqt: Path where output poses should be saved
        
    Returns:
        str: Vina stdout if successful (contains affinity scores)
        None: If execution fails
    """
    try:
        # Verify input files exist
        if not os.path.exists(receptor_pdbqt):
            logger.error(f"Receptor not found: {receptor_pdbqt}")
            return None
        
        if not os.path.exists(ligand_pdbqt):
            logger.error(f"Ligand not found: {ligand_pdbqt}")
            return None
        
        # Build Vina command
        cmd = [
            "vina",
            "--receptor", receptor_pdbqt,
            "--ligand", ligand_pdbqt,
            "--out", output_pdbqt,
            "--center_x", str(grid_config["center_x"]),
            "--center_y", str(grid_config["center_y"]),
            "--center_z", str(grid_config["center_z"]),
            "--size_x", str(grid_config["size_x"]),
            "--size_y", str(grid_config["size_y"]),
            "--size_z", str(grid_config["size_z"]),
            "--exhaustiveness", "24",
            "--num_modes", "15",
        ]
        
        logger.info(f"Running Vina: {' '.join(cmd[:5])}...")
        
        # Execute Vina with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
            creationflags=CREATE_NO_WINDOW
        )
        
        # Check exit code
        if result.returncode != 0:
            logger.error(f"Vina failed (exit code {result.returncode})")
            logger.error(f"stderr: {result.stderr[:200]}")
            return None
        
        # Verify output was created
        if not os.path.exists(output_pdbqt):
            logger.error(f"Output file not created: {output_pdbqt}")
            return None
        
        output_size = os.path.getsize(output_pdbqt)
        logger.info(f"✓ Vina completed: {output_pdbqt} ({output_size} bytes)")
        
        # Return raw stdout (contains affinity scores)
        return result.stdout
    
    except subprocess.TimeoutExpired:
        logger.error("Vina execution timed out (300s)")
        return None
    except Exception as e:
        logger.error(f"Vina execution error: {e}")
        return None
