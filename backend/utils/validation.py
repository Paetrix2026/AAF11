import os
from pathlib import Path
from utils.logger import get_logger

logger = get_logger("validation")


def validate_receptor(pdbqt_path: str) -> bool:
    """
    Validate a PDBQT receptor file for docking.
    
    Args:
        pdbqt_path: Path to the PDBQT file
        
    Returns:
        bool: True if valid receptor file
        
    Raises:
        FileNotFoundError: If file does not exist
        ValueError: If file is empty or invalid format
    """
    # Check file exists
    if not os.path.exists(pdbqt_path):
        error_msg = f"❌ Receptor file not found: {pdbqt_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    # Check file size > 0
    file_size = os.path.getsize(pdbqt_path)
    if file_size == 0:
        error_msg = f"❌ Receptor file is empty: {pdbqt_path}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    # Try opening and reading
    try:
        with open(pdbqt_path, "r") as f:
            lines = f.readlines()
    except Exception as e:
        error_msg = f"❌ Failed to read receptor file: {e}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    # Check for ATOM or HETATM records
    has_atoms = any(line.startswith(("ATOM", "HETATM")) for line in lines)
    
    if not has_atoms:
        error_msg = (
            f"❌ Invalid receptor file: No ATOM or HETATM records found.\n"
            f"   File: {pdbqt_path}\n"
            f"   Size: {file_size} bytes\n"
            f"   Lines: {len(lines)}"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    # All checks passed
    atom_count = len([l for l in lines if l.startswith(("ATOM", "HETATM"))])
    logger.info(f"✅ Valid receptor: {pdbqt_path} ({atom_count} atoms, {file_size} bytes)")
    
    return True
