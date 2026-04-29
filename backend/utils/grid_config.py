import numpy as np
from typing import Tuple, Dict
from utils.logger import get_logger

logger = get_logger("grid_config")


def compute_grid_center(pdb_path: str) -> Tuple[float, float, float]:
    """
    Compute the centroid (center) of a protein structure from a PDB file.
    
    Parses ATOM and HETATM records, extracts atomic coordinates,
    and returns the geometric center.
    
    Args:
        pdb_path: Path to PDB or PDBQT file
        
    Returns:
        Tuple[float, float, float]: (center_x, center_y, center_z)
        
    Raises:
        FileNotFoundError: If file does not exist
        ValueError: If no atomic coordinates found
    """
    try:
        coordinates = []
        
        with open(pdb_path, "r") as f:
            for line in f:
                # Parse ATOM and HETATM records
                if line.startswith(("ATOM", "HETATM")):
                    try:
                        # PDB format: columns are fixed-width
                        # X: 31-38, Y: 39-46, Z: 47-54
                        x = float(line[30:38].strip())
                        y = float(line[38:46].strip())
                        z = float(line[46:54].strip())
                        coordinates.append([x, y, z])
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Failed to parse coordinates from line: {line[:50]}")
                        continue
        
        if not coordinates:
            raise ValueError(f"No atomic coordinates found in {pdb_path}")
        
        # Convert to numpy array and compute centroid (mean)
        coords_array = np.array(coordinates)
        center = coords_array.mean(axis=0)
        
        center_x, center_y, center_z = float(center[0]), float(center[1]), float(center[2])
        
        logger.info(
            f"✅ Grid center computed from {len(coordinates)} atoms: "
            f"({center_x:.2f}, {center_y:.2f}, {center_z:.2f})"
        )
        
        return center_x, center_y, center_z
    
    except FileNotFoundError:
        error_msg = f"❌ PDB file not found: {pdb_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    except Exception as e:
        error_msg = f"❌ Error computing grid center: {e}"
        logger.error(error_msg)
        raise ValueError(error_msg)


def get_grid_config(pdb_path: str, size: int = 22) -> Dict[str, float]:
    """
    Get the complete docking grid configuration for Vina.
    
    Computes the protein centroid and returns a config dict with
    grid center and size (default 22 Å³ cube).
    
    Args:
        pdb_path: Path to PDB or PDBQT file
        size: Grid box size in Angstroms (default: 22)
        
    Returns:
        Dict with keys: center_x, center_y, center_z, size_x, size_y, size_z
        
    Raises:
        FileNotFoundError: If file does not exist
        ValueError: If coordinates cannot be extracted
    """
    center_x, center_y, center_z = compute_grid_center(pdb_path)
    
    config = {
        "center_x": center_x,
        "center_y": center_y,
        "center_z": center_z,
        "size_x": float(size),
        "size_y": float(size),
        "size_z": float(size),
    }
    
    logger.info(f"Grid config: {config}")
    
    return config
