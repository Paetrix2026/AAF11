import os
import subprocess
import shutil
import tempfile
import requests
import asyncio
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
        # Check specific path if not in PATH (windows)
        obabel_path = r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"
        if not os.path.exists(obabel_path):
            return False
    else:
        obabel_path = "obabel"
    
    try:
        # Step 1: Add hydrogens
        h_pdb = input_pdb + ".h.pdb"
        subprocess.run([obabel_path, input_pdb, "-O", h_pdb, "-h"], capture_output=True, timeout=30)
        
        # Step 2: Convert to PDBQT
        src_pdb = h_pdb if os.path.exists(h_pdb) else input_pdb
        result = subprocess.run(
            [obabel_path, src_pdb, "-O", output_pdbqt, "-xr"],
            capture_output=True, text=True, timeout=30
        )
        
        if os.path.exists(h_pdb):
            os.unlink(h_pdb)
            
        return result.returncode == 0
    except Exception as e:
        logger.error(f"obabel conversion failed: {e}")
        return False

async def fetch_alphafold(accession: str) -> str:
    """Fetch structure from AlphaFold Protein Structure Database."""
    try:
        url = f"https://alphafold.ebi.ac.uk/files/AF-{accession}-F1-model_v4.pdb"
        resp = requests.get(url, timeout=20)
        if resp.status_code == 200:
            logger.info(f"AlphaFold: Successfully fetched structure for {accession}")
            return resp.text
    except Exception as e:
        logger.warning(f"AlphaFold fetch failed for {accession}: {e}")
    return None

async def fetch_esmfold(sequence: str) -> str:
    """Predict structure using ESMFold API (Meta AI)."""
    try:
        url = "https://api.esmatlas.com/foldSequence/v1/pdb/"
        resp = requests.post(url, data=sequence, timeout=60)
        if resp.status_code == 200:
            logger.info("ESMFold: Successfully predicted structure from sequence")
            return resp.text
    except Exception as e:
        logger.warning(f"ESMFold prediction failed: {e}")
    return None

def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("StructurePrepAgent:running:Acquiring protein structure from multi-database (AlphaFold/ESM/RCSB)...")
    pathogen = state["pathogen"].upper()
    proteins = state.get("proteins", [])
    
    pdb_data = None
    source = None

    # Priority 1: AlphaFold DB (If we have UniProt accession)
    if proteins:
        for p in proteins:
            acc = p.get("accession")
            if acc:
                pdb_data = asyncio.run(fetch_alphafold(acc))
                if pdb_data:
                    source = f"AlphaFold ({acc})"
                    break
    
    # Priority 2: ESMFold (Predict from sequence if no AFDB match)
    if not pdb_data and proteins:
        for p in proteins:
            seq = p.get("sequence")
            if seq and len(seq) < 400: # ESMFold has limits
                pdb_data = asyncio.run(fetch_esmfold(seq))
                if pdb_data:
                    source = "ESMFold Prediction"
                    break

    # Priority 3: RCSB PDB Mapping (Experimental structures)
    if not pdb_data:
        pdb_id = None
        for key, val in PATHOGEN_PDB_MAP.items():
            if key in pathogen:
                pdb_id = val
                break
        
        if pdb_id:
            try:
                url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
                resp = requests.get(url, timeout=30)
                if resp.status_code == 200:
                    pdb_data = resp.text
                    source = f"RCSB PDB ({pdb_id})"
            except Exception as e:
                logger.error(f"Failed to fetch RCSB PDB {pdb_id}: {e}")

    # Fallback: Local Cache
    if not pdb_data:
        precomputed_dir = os.path.join(os.path.dirname(__file__), "..", "..", "public", "precomputed")
        precomputed_path = os.path.join(precomputed_dir, f"{pathogen.replace(' ', '_')}.pdb")
        if os.path.exists(precomputed_path):
            with open(precomputed_path) as f:
                pdb_data = f.read()
                source = "Local Precomputed Cache"

    if pdb_data:
        state["structure_pdb"] = pdb_data
        state["structure_source"] = source
        
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
                state["step_updates"].append(f"StructurePrepAgent:complete:Acquired structure via {source}")
            else:
                state["step_updates"].append(f"StructurePrepAgent:complete:Structure loaded ({source}), but PDBQT conversion failed")
    else:
        state["step_updates"].append("StructurePrepAgent:complete:No structure found in AlphaFold, ESMFold, or RCSB")

    return state
