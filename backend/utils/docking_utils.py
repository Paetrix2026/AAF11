import os
import subprocess
import tempfile
import shutil
import time
import platform
from typing import Optional, List, Dict, Tuple
from dataclasses import dataclass
from utils.logger import get_logger

# Flag to prevent subprocess windows from spawning on Windows
CREATE_NO_WINDOW = 0x08000000 if platform.system() == "Windows" else 0

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
        obabel_path = shutil.which("obabel") or r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"
        subprocess.run([obabel_path, input_pdb, "-O", output_pdb, "-h"], capture_output=True, creationflags=CREATE_NO_WINDOW)
        if not os.path.exists(output_pdb):
            shutil.copy(input_pdb, output_pdb)

    def _convert_to_pdbqt(self, input_pdb: str, output_pdbqt: str) -> None:
        obabel_path = shutil.which("obabel") or r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"
        subprocess.run([obabel_path, input_pdb, "-O", output_pdbqt, "-xr"], capture_output=True, creationflags=CREATE_NO_WINDOW)
        if not os.path.exists(output_pdbqt):
             subprocess.run([obabel_path, input_pdb, "-O", output_pdbqt], capture_output=True, creationflags=CREATE_NO_WINDOW)

class LigandPreparer:
    """Handles SMILES → PDBQT preparation using RDKit for 3D generation."""

    def prepare(self, smiles: str, output_path: str) -> bool:
        from rdkit import Chem
        from rdkit.Chem import AllChem
        
        try:
            # 1. Generate 3D structure with RDKit
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                logger.error(f"Failed to parse SMILES: {smiles}")
                return False
            
            mol = Chem.AddHs(mol)
            
            # Try ETKDG v3 (correct modern RDKit API)
            params = AllChem.ETKDGv3()
            params.randomSeed = 42
            res = AllChem.EmbedMolecule(mol, params)
            
            # Fallback 1: Permissive MMFF
            if res == -1:
                logger.warning(f"ETKDG v3 failed for {smiles}, trying permissive embedding")
                res = AllChem.EmbedMolecule(mol, randomSeed=42, maxAttempts=5000)
                
            # Fallback 2: Open Babel --gen3d
            if res == -1:
                logger.warning(f"RDKit embedding failed for {smiles}, using Open Babel")
                obabel_path = shutil.which("obabel") or r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"
                with tempfile.NamedTemporaryFile(suffix=".pdb", delete=False) as tmp:
                    tmp_pdb = tmp.name
                
                cmd = [obabel_path, "-ismi", "-", "-opdb", "-O", tmp_pdb, "--gen3d", "-h"]
                process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                process.communicate(input=smiles)
                
                if os.path.exists(tmp_pdb) and os.path.getsize(tmp_pdb) > 0:
                    mol = Chem.MolFromPDBFile(tmp_pdb)
                    if mol:
                        res = 0 # Success for the sake of the pipeline
                    os.remove(tmp_pdb)

            if res == -1:
                logger.error(f"[v3] FATAL: All 3D generation methods failed for {smiles}")
                return False

            # Optimize geometry
            try:
                AllChem.UFFOptimizeMolecule(mol)
            except Exception as e:
                logger.warning(f"UFF Optimization failed for {smiles}: {e}")

            # 2. Save to temporary PDB
            with tempfile.NamedTemporaryFile(suffix=".pdb", delete=False) as tmp:
                tmp_pdb = tmp.name
                Chem.MolToPDBFile(mol, tmp_pdb)
            
            # 3. Convert PDB to PDBQT with Open Babel
            obabel_path = shutil.which("obabel") or r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"
            cmd = [obabel_path, tmp_pdb, "-O", output_path, "-h"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Cleanup
            if os.path.exists(tmp_pdb):
                os.remove(tmp_pdb)
                
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
        except Exception as e:
            logger.error(f"Ligand prep failed: {e}")
            return False

def run_vina_docking(
    receptor_path: str,
    ligand_path: str,
    output_path: str,
    center: tuple = (0, 0, 0),
    size: tuple = (20, 20, 20),
    exhaustiveness: int = 8
) -> Tuple[Optional[float], Optional[int]]:
    vina_path = shutil.which("vina") or r"C:\tools\vina.EXE"
    if not os.path.exists(vina_path) and shutil.which("vina") is None:
        logger.error("Vina binary not found")
        return None, None

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
            "--exhaustiveness", str(exhaustiveness)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0:
            logger.error(f"Vina failed: {result.stderr}")
            return None, None

        return parse_vina_output(result.stdout)
    except Exception as e:
        logger.error(f"Vina execution error: {e}")
        return None, None

def parse_vina_output(stdout: str) -> Tuple[Optional[float], Optional[int]]:
    affinity = None
    seed = None
    try:
        for line in stdout.splitlines():
            if "Random seed:" in line:
                try:
                    seed = int(line.split(":")[1].strip())
                except:
                    pass
            parts = line.split()
            if affinity is None and len(parts) >= 2 and parts[0].isdigit():
                try:
                    affinity = float(parts[1])
                except:
                    pass
        return affinity, seed
    except Exception:
        return affinity, seed
