import os
import subprocess
import tempfile
import shutil
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
    smiles: str
    compound_name: str
    mutant_affinity: float
    wt_affinity: Optional[float] = None
    delta_ddg: Optional[float] = None
    ligand_pdb: Optional[str] = None
    status: str = "success"
    error: Optional[str] = None

class ProteinPreparer:
    """STRICT Protein Preparation: Fails loudly if any step fails."""

    async def prepare(self, pdb_content: str, pdb_id: str, output_dir: str) -> str:
        with tempfile.TemporaryDirectory() as tmpdir:
            pdb_path = os.path.join(tmpdir, f"{pdb_id}.pdb")
            with open(pdb_path, "w") as f:
                f.write(pdb_content)
            
            cleaned_pdb = os.path.join(tmpdir, f"{pdb_id}_cleaned.pdb")
            self._clean_pdb(pdb_path, cleaned_pdb)
            
            hydrogenated_pdb = os.path.join(tmpdir, f"{pdb_id}_H.pdb")
            self._add_hydrogens(cleaned_pdb, hydrogenated_pdb)
            
            pdbqt_path = os.path.join(output_dir, f"{pdb_id}_receptor.pdbqt")
            self._convert_to_pdbqt(hydrogenated_pdb, pdbqt_path)
            
            if not os.path.exists(pdbqt_path):
                raise RuntimeError(f"STRICT_FAIL: Receptor PDBQT was not generated for {pdb_id}")
                
            return pdbqt_path

    def _clean_pdb(self, input_pdb: str, output_pdb: str) -> None:
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
                elif line.startswith(("TER", "END", "CONECT")):
                    cleaned_lines.append(line)
        
        if not cleaned_lines:
            raise RuntimeError(f"STRICT_FAIL: No valid ATOM records found in {input_pdb} after cleaning.")
            
        with open(output_pdb, "w") as f:
            f.writelines(cleaned_lines)

    def _add_hydrogens(self, input_pdb: str, output_pdb: str) -> None:
        obabel = shutil.which("obabel")
        if not obabel:
            raise RuntimeError("STRICT_FAIL: 'obabel' executable not found in PATH.")
            
        result = subprocess.run([obabel, input_pdb, "-O", output_pdb, "-h"], capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0 or not os.path.exists(output_pdb):
            raise RuntimeError(f"STRICT_FAIL: obabel hydrogen addition failed.\nError: {result.stderr}")

    def _convert_to_pdbqt(self, input_pdb: str, output_pdbqt: str) -> None:
        obabel = shutil.which("obabel")
        # Use -xr for atom typing (required for Vina)
        result = subprocess.run([obabel, input_pdb, "-O", output_pdbqt, "-xr"], capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0 or not os.path.exists(output_pdbqt):
             raise RuntimeError(f"STRICT_FAIL: obabel PDBQT conversion failed.\nError: {result.stderr}")

class LigandPreparer:
    """STRICT Ligand Preparation: No fallbacks, no mocks."""

    def prepare(self, smiles: str, output_path: str) -> bool:
        from rdkit import Chem
        from rdkit.Chem import AllChem
        
        # 1. RDKit 3D Embed
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise RuntimeError(f"STRICT_FAIL: RDKit failed to parse SMILES: {smiles}")
        
        mol = Chem.AddHs(mol)
        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        res = AllChem.EmbedMolecule(mol, params)
        
        if res == -1:
            raise RuntimeError(f"STRICT_FAIL: RDKit 3D embedding failed for {smiles}. No fallback allowed.")

        # Success: Export SDF via TemporaryDirectory to avoid WinError 32
        AllChem.UFFOptimizeMolecule(mol)
        
        obabel = shutil.which("obabel")
        if not obabel:
            raise RuntimeError("STRICT_FAIL: 'obabel' not found in PATH.")

        with tempfile.TemporaryDirectory() as tmpdir:
            sdf_path = os.path.join(tmpdir, "ligand.sdf")
            writer = Chem.SDWriter(sdf_path)
            writer.write(mol)
            writer.close() # Release handle for Windows
            
            cmd = [obabel, sdf_path, "-O", output_path, "-xh"]
            result = subprocess.run(cmd, capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
            
            if result.returncode != 0:
                raise RuntimeError(f"STRICT_FAIL: obabel failed to convert ligand SDF to PDBQT.\nError: {result.stderr}")

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(f"STRICT_FAIL: Ligand PDBQT not created or empty for {smiles}")
            
        return True

def run_vina_docking(
    receptor_path: str,
    ligand_path: str,
    output_path: str,
    center: tuple = (0, 0, 0),
    size: tuple = (20, 20, 20),
    exhaustiveness: int = 8
) -> Tuple[float, int]:
    
    vina = shutil.which("vina")
    if not vina:
        raise RuntimeError("STRICT_FAIL: 'vina' executable not found in PATH.")

    cmd = [
        vina,
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
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600, creationflags=CREATE_NO_WINDOW)
    if result.returncode != 0:
        raise RuntimeError(f"STRICT_FAIL: AutoDock Vina execution failed.\nError: {result.stderr}")

    affinity, seed = parse_vina_output(result.stdout)
    if affinity is None:
        raise RuntimeError(f"STRICT_FAIL: Vina output parsing failed. No affinity found.\nFull Output:\n{result.stdout}")
        
    return affinity, seed

def parse_vina_output(stdout: str) -> Tuple[Optional[float], Optional[int]]:
    affinity = None
    seed = None
    for line in stdout.splitlines():
        if "Random seed:" in line:
            try: seed = int(line.split(":")[1].strip())
            except: pass
        
        tokens = line.split()
        if tokens and tokens[0].isdigit() and len(tokens) >= 2:
            try:
                val = float(tokens[1])
                if -20 < val < 0:
                    affinity = val
                    break
            except: pass
    return affinity, seed
