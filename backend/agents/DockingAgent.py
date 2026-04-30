import os
import tempfile
import shutil
from pipeline.state import PipelineState
from utils.logger import get_logger
from utils.docking_utils import run_vina_docking, LigandPreparer, SCREENING_COMPOUNDS

logger = get_logger("DockingAgent")


def run(state: PipelineState) -> PipelineState:
    pathogen = state.get("pathogen", "Unknown")
    state["step_updates"].append(f"DockingAgent:running:Screening compounds for {pathogen}...")
    receptor_pdbqt = state.get("structure_pdbqt")
    
    # Priority: 1. AI Discovered Compounds, 2. Manual/External Inputs
    compounds = state.get("known_compounds") or []
    if not compounds:
        logger.error("No dynamic compounds found. Aborting docking to prevent nonsensical analysis.")
        state["docking_results"] = []
        state["step_updates"].append("DockingAgent:failed:No therapeutic compounds identified for this condition")
        return state

    if not receptor_pdbqt:
        logger.warning(f"DockingAgent: receptor_pdbqt is missing or empty. Skipping docking for all compounds. Pathogen: {pathogen}")
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in compounds
        ]
        state["step_updates"].append("DockingAgent:complete:Receptor structure missing (skipping physical docking)")
        return state

    from utils.environment import get_binary_path
    vina_path = get_binary_path("vina")
    obabel_path = get_binary_path("obabel")
    
    if not vina_path:
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in compounds
        ]
        state["step_updates"].append("DockingAgent:complete:Vina binary missing")
        return state

    if not obabel_path:
        state["docking_results"] = [
            {"name": c["name"], "smiles": c["smiles"], "affinity": None}
            for c in compounds
        ]
        state["step_updates"].append("DockingAgent:complete:OpenBabel binary missing")
        return state

    results = []
    preparer = LigandPreparer()
    
    from concurrent.futures import ThreadPoolExecutor

    def dock_task(compound, receptor_path, tmpdir):
        smiles = compound.get("smiles")
        compound_name = compound.get("name")
        
        if not smiles or not isinstance(smiles, str):
            logger.warning(f"Skipping compound {compound_name}: Missing or invalid SMILES")
            return {
                "name": compound_name,
                "smiles": smiles,
                "affinity": None,
                "status": "invalid_smiles"
            }

        ligand_path = os.path.join(tmpdir, f"{compound['name']}.pdbqt")
        output_path = os.path.join(tmpdir, f"{compound['name']}_out.pdbqt")
        
        if preparer.prepare(smiles, ligand_path):
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
            futures = [executor.submit(dock_task, c, receptor_path, tmpdir) for c in compounds]
            results = [f.result() for f in futures]

    # Sort by affinity
    results.sort(key=lambda x: (x["affinity"] is None, x["affinity"]))
    state["docking_results"] = results
    
    count = len([r for r in results if r["status"] == "success"])
    state["step_updates"].append(f"DockingAgent:complete:Successfully docked {count} compounds")
    
    return state
