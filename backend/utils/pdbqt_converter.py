import subprocess
import os
import platform
from typing import Optional
from utils.logger import get_logger

logger = get_logger("pdbqt_converter")

# Windows subprocess flag to prevent cmd window spawning
CREATE_NO_WINDOW = 0x08000000 if platform.system() == "Windows" else 0


def convert_to_pdbqt(input_pdb: str, output_pdbqt: str) -> bool:
    """
    Convert PDB file to PDBQT format using Open Babel.
    
    Args:
        input_pdb: Path to input PDB file
        output_pdbqt: Path where PDBQT file should be saved
        
    Returns:
        bool: True if conversion successful, False otherwise
    """
    try:
        # Verify input file exists
        if not os.path.exists(input_pdb):
            logger.error(f"Input PDB not found: {input_pdb}")
            return False
        
        # Build obabel command
        cmd = [
            "obabel",
            input_pdb,
            "-O", output_pdbqt,
            "-p", "7.4"  # pH for protonation
        ]
        
        logger.info(f"Running: {' '.join(cmd)}")
        
        # Execute conversion
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            creationflags=CREATE_NO_WINDOW
        )
        
        # Check if conversion succeeded
        if result.returncode != 0:
            logger.error(f"Obabel failed (exit code {result.returncode})")
            logger.error(f"stderr: {result.stderr}")
            return False
        
        # Verify output file was created
        if not os.path.exists(output_pdbqt):
            logger.error(f"Output PDBQT not created: {output_pdbqt}")
            return False
        
        file_size = os.path.getsize(output_pdbqt)
        logger.info(f"✓ Converted to PDBQT: {output_pdbqt} ({file_size} bytes)")
        
        return True
    
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return False
