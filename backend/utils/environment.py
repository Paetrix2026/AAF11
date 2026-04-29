import shutil
from utils.logger import get_logger

logger = get_logger("environment")


def check_environment() -> bool:
    """
    Check if required docking tools (vina and obabel) are available in PATH.
    
    Returns:
        bool: True if both vina and obabel are found
        
    Raises:
        EnvironmentError: If either vina or obabel is not found
    """
    vina_path = shutil.which("vina")
    obabel_path = shutil.which("obabel")
    
    print(f"🔍 Checking environment for docking tools...")
    print(f"   Vina:    {vina_path if vina_path else '❌ NOT FOUND'}")
    print(f"   OpenBabel: {obabel_path if obabel_path else '❌ NOT FOUND'}")
    
    if not vina_path:
        error_msg = (
            "❌ AutoDock Vina not found in PATH.\n"
            "Please install Vina or add it to your PATH and try again."
        )
        logger.error(error_msg)
        raise EnvironmentError(error_msg)
    
    if not obabel_path:
        error_msg = (
            "❌ OpenBabel (obabel) not found in PATH.\n"
            "Please install OpenBabel or add it to your PATH and try again."
        )
        logger.error(error_msg)
        raise EnvironmentError(error_msg)
    
    print(f"✅ All docking tools available!\n")
    return True
