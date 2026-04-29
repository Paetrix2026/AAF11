import os
import subprocess
import tempfile
import shutil
import platform
import numpy as np
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
    """STRICT Protein Preparation with Centering."""

    async def prepare(self, pdb_content: str, pdb_id: str, output_dir: str) -> str:
        with tempfile.TemporaryDirectory() as tmpdir:
            pdb_path = os.path.join(tmpdir, f"{pdb_id}.pdb")
            with open(pdb_path, "w") as f:
                f.write(pdb_content)
            
            # 1. Clean and Center
            centered_pdb = os.path.join(output_dir, f"{pdb_id}_centered.pdb")
            self._clean_and_center_pdb(pdb_path, centered_pdb)
            
            # 2. Add Hydrogens
            hydrogenated_pdb = os.path.join(tmpdir, f"{pdb_id}_H.pdb")
            self._add_hydrogens(centered_pdb, hydrogenated_pdb)
            
            # 3. Convert to PDBQT
            pdbqt_path = os.path.join(output_dir, f"{pdb_id}_receptor.pdbqt")
            self._convert_to_pdbqt(hydrogenated_pdb, pdbqt_path)
            
            return pdbqt_path

    def _clean_and_center_pdb(self, input_pdb: str, output_pdb: str) -> None:
        standard_residues = {
            "ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY",
            "HIS", "ILE", "LEU", "LYS", "MET", "PHE", "PRO", "SER",
            "THR", "TRP", "TYR", "VAL"
        }
        
        coords = []
        lines = []
        with open(input_pdb, "r") as f:
            for line in f:
                if line.startswith(("ATOM", "HETATM")):
                    res_name = line[17:20].strip()
                    if line.startswith("HETATM") and res_name not in standard_residues:
                        continue
                    
                    try:
                        x = float(line[30:38])
                        y = float(line[38:46])
                        z = float(line[46:54])
                        coords.append([x, y, z])
                        lines.append(line)
                    except:
                        continue
                elif line.startswith(("TER", "END", "CONECT")):
                    lines.append(line)

        if not coords:
            raise RuntimeError(f"STRICT_FAIL: No valid coordinates found in {input_pdb}")

        # Calculate geometric center
        center = np.mean(coords, axis=0)
        logger.info(f"Centering protein from {center} to [0,0,0]")

        # Shift coordinates
        with open(output_pdb, "w") as f:
            for line in lines:
                if line.startswith(("ATOM", "HETATM")):
                    x = float(line[30:38]) - center[0]
                    y = float(line[38:46]) - center[1]
                    z = float(line[46:54]) - center[2]
                    # Format back to PDB spec (8.3f)
                    new_line = line[:30] + f"{x:8.3f}{y:8.3f}{z:8.3f}" + line[54:]
                    f.write(new_line)
                else:
                    f.write(line)

    def _add_hydrogens(self, input_pdb: str, output_pdb: str) -> None:
        obabel = shutil.which("obabel")
        if not obabel: raise RuntimeError("STRICT_FAIL: 'obabel' not found in PATH.")
        result = subprocess.run([obabel, input_pdb, "-O", output_pdb, "-h"], capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0 or not os.path.exists(output_pdb):
            raise RuntimeError(f"STRICT_FAIL: obabel hydrogen addition failed.\nError: {result.stderr}")

    def _convert_to_pdbqt(self, input_pdb: str, output_pdbqt: str) -> None:
        obabel = shutil.which("obabel")
        result = subprocess.run([obabel, input_pdb, "-O", output_pdbqt, "-xr"], capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0 or not os.path.exists(output_pdbqt):
             raise RuntimeError(f"STRICT_FAIL: obabel PDBQT conversion failed.\nError: {result.stderr}")

class LigandPreparer:
    """STRICT Ligand Preparation with high-attempt embedding."""

    def prepare(self, smiles: str, output_path: str) -> bool:
        from rdkit import Chem
        from rdkit.Chem import AllChem
        
        mol = Chem.MolFromSmiles(smiles)
        if mol is None: raise RuntimeError(f"STRICT_FAIL: RDKit parse failed: {smiles}")
        
        mol = Chem.AddHs(mol)
        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        params.maxAttempts = 10000  # Increased for complex rings like Baloxavir
        params.useRandomCoords = True 
        params.useBasicKnowledge = True # Use chemical knowledge for ring systems
        
        res = AllChem.EmbedMolecule(mol, params)
        if res == -1:
            # Fallback to older but sometimes more robust ETKDG
            res = AllChem.EmbedMolecule(mol, maxAttempts=5000, useRandomCoords=True, randomSeed=42)
            
        if res == -1:
            raise RuntimeError(f"STRICT_FAIL: RDKit 3D embedding failed for {smiles} after 15000 combined attempts. This molecule is too rigid/complex for standard conformer search.")

        # Use MMFF for better drug-like optimization if possible, fallback to UFF
        try:
            AllChem.MMFFOptimizeMolecule(mol)
        except:
            AllChem.UFFOptimizeMolecule(mol)
        
        obabel = shutil.which("obabel")
        with tempfile.TemporaryDirectory() as tmpdir:
            sdf_path = os.path.join(tmpdir, "ligand.sdf")
            writer = Chem.SDWriter(sdf_path)
            writer.write(mol)
            writer.close()
            
            cmd = [obabel, sdf_path, "-O", output_path, "-xh"]
            result = subprocess.run(cmd, capture_output=True, text=True, creationflags=CREATE_NO_WINDOW)
            if result.returncode != 0:
                raise RuntimeError(f"STRICT_FAIL: obabel ligand conversion failed.\nError: {result.stderr}")

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
    if not vina: raise RuntimeError("STRICT_FAIL: 'vina' not found in PATH.")

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
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600, creationflags=CREATE_NO_WINDOW)
        if result.returncode != 0:
            raise RuntimeError(f"STRICT_FAIL: Vina failed.\nError: {result.stderr}\nOutput: {result.stdout}")
    except subprocess.TimeoutExpired:
        raise RuntimeError("STRICT_FAIL: Vina docking timed out after 600 seconds.")

    affinity, seed = parse_vina_output(result.stdout)
    if affinity is None:
        raise RuntimeError(f"STRICT_FAIL: Vina parsing failed (Affinity 0 or not found).\nOutput:\n{result.stdout}")
        
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
                # Accepting any real negative interaction now that we centered the protein
                if -25 < val < 0.00001:
                    affinity = val
                    break
            except: pass
    return affinity, seed
