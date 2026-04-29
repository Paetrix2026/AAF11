import os
import subprocess
import shutil
import tempfile
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("StructurePrepAgent")

# RCSB PDB ID mapping for common pathogens
PATHOGEN_PDB_MAP = {
    "H5N1": "4WSB",
    "H1N1": "3LZG",
    "H3N2": "4FP8",
    "SARS-COV-2": "7BZ5",
    "COVID-19": "7BZ5",
    "INFLUENZA": "4WSB",
}


def fetch_pdb_from_rcsb(pdb_id: str) -> str | None:
    """Fetch PDB data from RCSB."""
    import requests
    try:
        url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
        resp = requests.get(url, timeout=30)
        if resp.status_code == 200:
            return resp.text
    except Exception as e:
        logger.error(f"Failed to fetch PDB {pdb_id}: {e}")
    return None


def convert_to_pdbqt(pdb_data: str, output_path: str) -> bool:
    """Convert PDB to PDBQT using obabel for AutoDock Vina."""
    if not shutil.which("obabel"):
        logger.warning("obabel not found, skipping PDBQT conversion")
        return False

    with tempfile.NamedTemporaryFile(mode="w", suffix=".pdb", delete=False) as f:
        f.write(pdb_data)
        pdb_path = f.name

    try:
        result = subprocess.run(
            ["obabel", pdb_path, "-O", output_path, "-xr"],
            capture_output=True, text=True, timeout=30
        )
        os.unlink(pdb_path)
        return result.returncode == 0
    except Exception as e:
        logger.error(f"obabel conversion failed: {e}")
        if os.path.exists(pdb_path):
            os.unlink(pdb_path)
        return False


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("StructurePrepAgent:running:Loading protein structure...")
    pathogen = state["pathogen"].upper()

    # Check for precomputed structure
    precomputed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "precomputed")
    precomputed_path = os.path.join(precomputed_dir, f"{pathogen.replace(' ', '_')}.pdb")

    if os.path.exists(precomputed_path):
        with open(precomputed_path) as f:
            state["structure_pdb"] = f.read()
        state["step_updates"].append("StructurePrepAgent:complete:Loaded precomputed structure")
        return state

    # Map pathogen to PDB ID
    pdb_id = None
    for key, val in PATHOGEN_PDB_MAP.items():
        if key in pathogen:
            pdb_id = val
            break

    if pdb_id:
        pdb_data = fetch_pdb_from_rcsb(pdb_id)
        if pdb_data:
            state["structure_pdb"] = pdb_data
            state["step_updates"].append(f"StructurePrepAgent:complete:Fetched PDB {pdb_id} from RCSB")
            return state

    state["step_updates"].append("StructurePrepAgent:complete:No structure found (continuing without 3D data)")
    return state
