import os
import tempfile
import shutil
from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.docking_utils import run_vina_docking, LigandPreparer, SCREENING_COMPOUNDS

logger = get_logger("DockingAgent")


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("DockingAgent:running:Screening antiviral compounds...")
    receptor_pdbqt = state.get("structure_pdbqt")

    if not receptor_pdbqt:
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in SCREENING_COMPOUNDS
        ]
        state["step_updates"].append("DockingAgent:complete:Receptor structure not ready (returning list only)")
        return state

    vina_path = shutil.which("vina") or r"C:\tools\vina.EXE"
    obabel_path = shutil.which("obabel") or r"C:\Program Files\OpenBabel-3.1.1\obabel.exe"

    if not os.path.exists(vina_path) and not shutil.which("vina"):
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in SCREENING_COMPOUNDS
        ]
        state["step_updates"].append("DockingAgent:complete:Vina binary missing")
        return state

    if not os.path.exists(obabel_path) and not shutil.which("obabel"):
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in SCREENING_COMPOUNDS
        ]
        state["step_updates"].append("DockingAgent:complete:OpenBabel binary missing")
        return state

    results = []
    preparer = LigandPreparer()
    
    from concurrent.futures import ThreadPoolExecutor

    def dock_task(compound, receptor_path, tmpdir):
        ligand_path = os.path.join(tmpdir, f"{compound['name']}.pdbqt")
        output_path = os.path.join(tmpdir, f"{compound['name']}_out.pdbqt")
        
        if preparer.prepare(compound["smiles"], ligand_path):
            affinity, seed = run_vina_docking(receptor_path, ligand_path, output_path)
            return {
                "name": compound["name"],
                "smiles": compound["smiles"],
                "affinity": affinity,
                "seed": seed,
                "status": "success" if affinity is not None else "failed"
            }
        else:
            return {
                "name": compound["name"],
                "smiles": compound["smiles"],
                "affinity": None,
                "status": "prep_failed"
            }

    with tempfile.TemporaryDirectory() as tmpdir:
        receptor_path = os.path.join(tmpdir, "receptor.pdbqt")
        with open(receptor_path, "w") as f:
            f.write(receptor_pdbqt)

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(dock_task, c, receptor_path, tmpdir) for c in SCREENING_COMPOUNDS]
            results = [f.result() for f in futures]

    # Sort by affinity
    results.sort(key=lambda x: (x["affinity"] is None, x["affinity"]))
    state["docking_results"] = results
    
    count = len([r for r in results if r["status"] == "success"])
    state["step_updates"].append(f"DockingAgent:complete:Successfully docked {count} compounds")
    
    return state
