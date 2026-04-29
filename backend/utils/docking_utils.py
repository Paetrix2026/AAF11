import os
import subprocess
import tempfile
import shutil
import time
from typing import Optional, List, Dict, Tuple
from dataclasses import dataclass
from utils.logger import get_logger

logger = get_logger("docking_utils")

SCREENING_COMPOUNDS = [
    {"name": "Oseltamivir", "smiles": "CCOC(=O)C1=C[C@@H](OC(CC)CC)[C@H](NC(C)=O)[C@@H](N)C1"},
    {"name": "Zanamivir", "smiles": "CC(=O)N[C@@H]([C@H](O)[C@H](O)CO)[C@@H]1OC(C[C@H]1N=C(N)N)=C(O)O"},
    {"name": "Baloxavir", "smiles": "CC1=C(C=CC=C1)OC2=CC3=C(C=C2)N4CC(C(C4=O)O3)C5=CC=C(C=C5)F"},
    {"name": "Remdesivir", "smiles": "CCC(CC)COC(=O)[C@H](C)NP(=O)(OC[C@H]1[C@@H]([C@@H]([C@](O1)(C#N)C2=CC=C3N2N=CN=C3N)O)O)OC4=CC=CC=C4"}
]

@dataclass
class DockingResult:
    """Type-safe docking result container."""
    smiles: str
    compound_name: str
    mutant_affinity: float
    wt_affinity: Optional[float] = None
    delta_ddg: Optional[float] = None
    complex_pdb_path: Optional[str] = None
    ligand_pdb_path: Optional[str] = None
    protein_pdb_path: Optional[str] = None
    is_validated: bool = True
    error: Optional[str] = None

class ProteinPreparer:
    """Handles PDB → PDBQT structure preparation and cleanup."""

    def __init__(self):
        self.log = logger

    async def prepare(self, pdb_content: str, pdb_id: str, output_dir: str) -> str:
        """Prepare protein for docking with cleaning and hydrogen addition."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Step 1: Write input PDB
            pdb_path = os.path.join(tmpdir, f"{pdb_id}.pdb")
            with open(pdb_path, "w") as f:
                f.write(pdb_content)
            
            # Step 2: Clean structure (remove water, ligands)
            cleaned_pdb = os.path.join(tmpdir, f"{pdb_id}_cleaned.pdb")
            self._clean_pdb(pdb_path, cleaned_pdb)
            
            # Step 3: Add hydrogens using Open Babel
            hydrogenated_pdb = os.path.join(tmpdir, f"{pdb_id}_H.pdb")
            self._add_hydrogens(cleaned_pdb, hydrogenated_pdb)
            
            # Step 4: Convert to PDBQT
            pdbqt_path = os.path.join(output_dir, f"{pdb_id}_receptor.pdbqt")
            self._convert_to_pdbqt(hydrogenated_pdb, pdbqt_path)
            
            return pdbqt_path

    def _clean_pdb(self, input_pdb: str, output_pdb: str) -> None:
        """Remove water and heteroatoms to keep only standard residues."""
        standard_residues = {
            "ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY",
            "HIS", "ILE", "LEU", "LYS", "MET", "PHE", "PRO", "SER",
            "THR", "TRP", "TYR", "VAL"
        }
        
        cleaned_lines = []
        with open(input_pdb, "r") as f:
            for line in f:
                if line.startswith(("ATOM", "HETATM")):
                    res_name = line[17:20].strip()
                    if line.startswith("HETATM") and res_name not in standard_residues:
                        continue
                    cleaned_lines.append(line)
                elif line.startswith(("TER", "END")):
                    cleaned_lines.append(line)
        
        with open(output_pdb, "w") as f:
            f.writelines(cleaned_lines)

    def _add_hydrogens(self, input_pdb: str, output_pdb: str) -> None:
        obabel_path = shutil.which("obabel") or "obabel"
        subprocess.run([obabel_path, input_pdb, "-O", output_pdb, "-h"], capture_output=True)
        if not os.path.exists(output_pdb):
            shutil.copy(input_pdb, output_pdb)

    def _convert_to_pdbqt(self, input_pdb: str, output_pdbqt: str) -> None:
        obabel_path = shutil.which("obabel") or "obabel"
        subprocess.run([obabel_path, input_pdb, "-O", output_pdbqt, "-xr"], capture_output=True)
        if not os.path.exists(output_pdbqt):
             subprocess.run([obabel_path, input_pdb, "-O", output_pdbqt], capture_output=True)

class LigandPreparer:
    """Handles SMILES → PDBQT preparation."""

    def prepare(self, smiles: str, output_path: str) -> bool:
        obabel_path = shutil.which("obabel") or "obabel"
        try:
            # Generate 3D coordinates and convert to PDBQT directly
            cmd = [
                obabel_path,
                "-ismi", "-",
                "-opdbqt",
                "-O", output_path,
                "--gen3d",
                "-p", "7.4"
            ]
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            process.communicate(input=smiles)
            return process.returncode == 0 and os.path.exists(output_path)
        except Exception as e:
            logger.error(f"Ligand prep failed: {e}")
            return False

def run_vina_docking(receptor_path: str, ligand_path: str, output_path: str, center: tuple = (0, 0, 0), size: tuple = (20, 20, 20)) -> Optional[float]:
    vina_path = shutil.which("vina") or "C:\\tools\\vina.EXE"
    if not os.path.exists(vina_path) and shutil.which("vina") is None:
        logger.error("Vina binary not found")
        return None

    try:
        cmd = [
            vina_path if os.path.exists(vina_path) else "vina",
            "--receptor", receptor_path,
            "--ligand", ligand_path,
            "--out", output_path,
            "--center_x", str(center[0]),
            "--center_y", str(center[1]),
            "--center_z", str(center[2]),
            "--size_x", str(size[0]),
            "--size_y", str(size[1]),
            "--size_z", str(size[2]),
            "--exhaustiveness", "8"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            logger.error(f"Vina failed: {result.stderr}")
            return None

        return parse_vina_output(result.stdout)
    except Exception as e:
        logger.error(f"Vina execution error: {e}")
        return None

def parse_vina_output(stdout: str) -> Optional[float]:
    try:
        for line in stdout.splitlines():
            parts = line.split()
            if len(parts) >= 2 and parts[0].isdigit():
                return float(parts[1])
        return None
    except Exception:
        return None
