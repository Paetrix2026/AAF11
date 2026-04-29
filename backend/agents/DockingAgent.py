import os
import subprocess
import shutil
import tempfile
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("DockingAgent")

# Known compounds for docking screening
SCREENING_COMPOUNDS = [
    {"name": "Oseltamivir", "smiles": "CCOC(=O)[C@@H]1C[C@@H](NC(C)=O)[C@@H](OC(CC)CC)[C@H](N)C1"},
    {"name": "Baloxavir", "smiles": "CC1(C)C[C@@H]2CC(=O)N(Cc3cc4c(F)cccc4[nH]3)[C@@]2(O1)c1cc(F)ccc1F"},
    {"name": "Zanamivir", "smiles": "OC[C@@H](O)[C@@H](O)[C@@H](O)C1=C[C@@H](NC(=N)N)[C@@H](N=C(N)N)OC1C(O)=O"},
    {"name": "Remdesivir", "smiles": "CCC(CC)COC(=O)[C@@H](N[P](=O)(OCC1[C@@H]([C@H](C(O1)n1cnc2c(N)ncnc12)O)F)Oc1ccccc1)C"},
]


def run_vina_docking(receptor_pdbqt: str, ligand_smiles: str, ligand_name: str) -> dict | None:
    """Run AutoDock Vina docking via subprocess."""
    if not shutil.which("vina"):
        logger.warning("AutoDock Vina not found")
        return None

    if not shutil.which("obabel"):
        logger.warning("obabel not found for ligand prep")
        return None

    tmp_dir = tempfile.mkdtemp()
    try:
        # Prepare ligand PDBQT
        ligand_pdb_path = os.path.join(tmp_dir, "ligand.smi")
        ligand_pdbqt_path = os.path.join(tmp_dir, "ligand.pdbqt")
        output_path = os.path.join(tmp_dir, "output.pdbqt")

        with open(ligand_pdb_path, "w") as f:
            f.write(f"{ligand_smiles}\n")

        # Convert SMILES to PDBQT
        result = subprocess.run(
            ["obabel", "-ismi", ligand_pdb_path, "-opdbqt", "-O", ligand_pdbqt_path, "--gen3d"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return None

        # Run Vina with default box (large search space)
        vina_result = subprocess.run(
            [
                "vina",
                "--receptor", receptor_pdbqt,
                "--ligand", ligand_pdbqt_path,
                "--out", output_path,
                "--center_x", "0", "--center_y", "0", "--center_z", "0",
                "--size_x", "40", "--size_y", "40", "--size_z", "40",
                "--exhaustiveness", "4",
                "--num_modes", "3",
            ],
            capture_output=True, text=True, timeout=120
        )

        if vina_result.returncode != 0:
            return None

        # Parse binding affinity from output
        affinity = None
        for line in vina_result.stdout.split("\n"):
            if "REMARK VINA RESULT" in line:
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        affinity = float(parts[3])
                        break
                    except ValueError:
                        pass

        return {
            "name": ligand_name,
            "smiles": ligand_smiles,
            "affinity_kcal_mol": affinity,
        }
    except Exception as e:
        logger.error(f"Docking failed for {ligand_name}: {e}")
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("DockingAgent:running:Screening compounds against binding pocket...")
    pdb_data = state.get("structure_pdb")

    if not pdb_data:
        state["docking_results"] = []
        state["step_updates"].append("DockingAgent:complete:No structure available for docking")
        return state

    if not shutil.which("vina") or not shutil.which("obabel"):
        # Cannot dock without tools, but still surface the compound list
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity_kcal_mol": None}
            for c in SCREENING_COMPOUNDS
        ]
        state["step_updates"].append("DockingAgent:complete:Docking tools unavailable — compound list returned")
        return state

    # Prepare receptor PDBQT
    tmp_dir = tempfile.mkdtemp()
    receptor_pdbqt = os.path.join(tmp_dir, "receptor.pdbqt")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".pdb", delete=False) as f:
        f.write(pdb_data)
        pdb_path = f.name

    try:
        subprocess.run(
            ["obabel", pdb_path, "-O", receptor_pdbqt, "-xr"],
            capture_output=True, text=True, timeout=30
        )
        os.unlink(pdb_path)

        results = []
        for compound in SCREENING_COMPOUNDS:
            result = run_vina_docking(receptor_pdbqt, compound["smiles"], compound["name"])
            if result:
                results.append(result)

        # Sort by affinity (most negative = best)
        results.sort(key=lambda x: x.get("affinity_kcal_mol") or 0)
        state["docking_results"] = results
        state["step_updates"].append(f"DockingAgent:complete:Screened {len(results)} compound(s)")
    except Exception as e:
        logger.error(f"Docking workflow failed: {e}")
        state["docking_results"] = []
        state["step_updates"].append("DockingAgent:complete:Docking failed — see logs")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return state
