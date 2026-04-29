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


def clean_pdb(input_pdb: str, output_pdb: str) -> None:
    """Remove water, ligands, and non-standard residues."""
    standard_residues = {
        "ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY",
        "HIS", "ILE", "LEU", "LYS", "MET", "PHE", "PRO", "SER",
        "THR", "TRP", "TYR", "VAL",
        "DA", "DG", "DC", "DT", "A", "G", "C", "U"
    }
    
    cleaned_lines = []
    with open(input_pdb, "r") as f:
        for line in f:
            if line.startswith(("ATOM", "HETATM")):
                res_name = line[17:20].strip()
                if res_name not in standard_residues:
                    continue
                cleaned_lines.append(line)
            elif line.startswith(("HEADER", "TITLE", "REMARK", "END", "CONECT")):
                cleaned_lines.append(line)
    
    with open(output_pdb, "w") as f:
        f.writelines(cleaned_lines)


def convert_to_pdbqt(input_pdb: str, output_pdbqt: str) -> bool:
    """Convert PDB to PDBQT using obabel."""
    if not shutil.which("obabel"):
        return False
    
    try:
        # Step 1: Add hydrogens
        h_pdb = input_pdb + ".h.pdb"
        subprocess.run(["obabel", input_pdb, "-O", h_pdb, "-h"], capture_output=True, timeout=30)
        
        # Step 2: Convert to PDBQT
        src_pdb = h_pdb if os.path.exists(h_pdb) else input_pdb
        result = subprocess.run(
            ["obabel", src_pdb, "-O", output_pdbqt, "-xr"],
            capture_output=True, text=True, timeout=30
        )
        
        if os.path.exists(h_pdb):
            os.unlink(h_pdb)
            
        return result.returncode == 0
    except Exception as e:
        logger.error(f"obabel conversion failed: {e}")
        return False


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("StructurePrepAgent:running:Preparing protein structure for docking...")
    pathogen = state["pathogen"].upper()

    # RCSB Fetching
    pdb_id = None
    for key, val in PATHOGEN_PDB_MAP.items():
        if key in pathogen:
            pdb_id = val
            break

    pdb_data = None
    if pdb_id:
        import requests
        try:
            url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
            resp = requests.get(url, timeout=30)
            if resp.status_code == 200:
                pdb_data = resp.text
        except Exception as e:
            logger.error(f"Failed to fetch PDB {pdb_id}: {e}")

    if not pdb_data:
        # Fallback to precomputed if RCSB fails
        precomputed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "precomputed")
        precomputed_path = os.path.join(precomputed_dir, f"{pathogen.replace(' ', '_')}.pdb")
        if os.path.exists(precomputed_path):
            with open(precomputed_path) as f:
                pdb_data = f.read()

    if pdb_data:
        state["structure_pdb"] = pdb_data
        
        # Prepare PDBQT for docking
        with tempfile.TemporaryDirectory() as tmpdir:
            input_pdb = os.path.join(tmpdir, "input.pdb")
            cleaned_pdb = os.path.join(tmpdir, "cleaned.pdb")
            pdbqt_path = os.path.join(tmpdir, "receptor.pdbqt")
            
            with open(input_pdb, "w") as f:
                f.write(pdb_data)
            
            clean_pdb(input_pdb, cleaned_pdb)
            if convert_to_pdbqt(cleaned_pdb, pdbqt_path):
                with open(pdbqt_path, "r") as f:
                    state["structure_pdbqt"] = f.read()
                state["step_updates"].append(f"StructurePrepAgent:complete:Prepared PDBQT for {pdb_id or pathogen}")
            else:
                state["step_updates"].append("StructurePrepAgent:complete:Protein loaded, but PDBQT conversion failed (obabel missing?)")
    else:
        state["step_updates"].append("StructurePrepAgent:complete:No structure found for docking")

    return state
