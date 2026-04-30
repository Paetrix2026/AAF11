import os
import shutil
from utils.logger import get_logger

logger = get_logger("environment")

def get_binary_path(name: str) -> str:
    """Get the path to a binary with intelligent fallbacks."""
    # 1. Check PATH
    path = shutil.which(name)
    if path:
        return path
        
    # 2. Windows Fallbacks
    fallbacks = {
        "vina": [
            r"C:\tools\vina.EXE",
            r"C:\Program Files (x86)\The Scripps Research Institute\Vina\vina.exe"
        ],
        "obabel": [
            r"C:\Program Files\OpenBabel-3.1.1\obabel.exe",
            r"C:\Program Files (x86)\OpenBabel-2.4.1\obabel.exe",
            r"C:\tools\obabel.exe"
        ],
        "mafft": [
            r"C:\mafft-win\mafft.bat",
            r"C:\Program Files\MAFFT\mafft.bat"
        ]
    }
    
    if name in fallbacks:
        for fallback in fallbacks[name]:
            if os.path.exists(fallback):
                return fallback
                
    return None

def check_environment() -> bool:
    """Check if required docking tools are available."""
    vina_path = get_binary_path("vina")
    obabel_path = get_binary_path("obabel")
    mafft_path = get_binary_path("mafft")
    
    print(f"🔍 Checking environment for clinical tools...")
    print(f"   Vina:      {vina_path if vina_path else '❌ NOT FOUND'}")
    print(f"   OpenBabel: {obabel_path if obabel_path else '❌ NOT FOUND'}")
    print(f"   MAFFT:     {mafft_path if mafft_path else '❌ NOT FOUND'}")
    
    # We only raise for hard requirements
    if not vina_path or not obabel_path:
        error_msg = "❌ Required docking tools (Vina/OpenBabel) not found. Check C:\\tools or PATH."
        logger.error(error_msg)
        return False
        
    print(f"✅ Core clinical tools available!\n")
    return True
