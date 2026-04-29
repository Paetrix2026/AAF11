from typing import Optional, Tuple
from utils.logger import get_logger

logger = get_logger("vina_parser")


def parse_vina_output(stdout: str) -> Tuple[Optional[float], Optional[int]]:
    """
    Parse AutoDock Vina output and extract binding affinity and random seed.
    
    Vina produces output with a table of docking results:
    
    Mode |   Affinity | RMSD l.b.| RMSD u.b.| Frequency
    -----+-----------+---------+---------+---------+
      1  |  -8.5  |   0.0  |   0.0  | 100
      2  |  -7.8  |   1.2  |   3.4  |  95
      3  |  -6.2  |   2.1  |   4.8  |  80
    
    Args:
        stdout: Raw stdout from Vina execution
        
    Returns:
        Tuple[Optional[float], Optional[int]]:
            - best_affinity: Minimum (best) affinity score in kcal/mol
            - seed: Random seed used for docking (if found)
    """
    best_affinity = None
    seed = None
    affinities = []
    
    try:
        for line in stdout.splitlines():
            # Extract random seed if present
            if "Random seed:" in line:
                try:
                    seed = int(line.split(":")[-1].strip())
                    logger.info(f"Seed: {seed}")
                except (ValueError, IndexError):
                    logger.warning(f"Failed to parse seed from: {line}")
                    pass
            
            # Parse mode/affinity table lines
            # Format: "  1  |  -8.5  |   0.0  |   0.0  | 100"
            # Split by pipes to get columns
            if "|" not in line:
                continue
            
            parts = line.split("|")
            if len(parts) < 2:
                continue
            
            # Try to parse first column as mode number
            try:
                mode = int(parts[0].strip())
                # parts[1] should be the affinity value
                affinity = float(parts[1].strip())
                affinities.append(affinity)
            except (ValueError, IndexError):
                # Not a mode line, skip
                continue
        
        # Find best (minimum) affinity
        if affinities:
            best_affinity = min(affinities)
            logger.info(f"Best affinity: {best_affinity:.2f} kcal/mol ({len(affinities)} modes)")
        else:
            logger.warning("No affinity values found in Vina output")
    
    except Exception as e:
        logger.error(f"Error parsing Vina output: {e}")
    
    return best_affinity, seed
