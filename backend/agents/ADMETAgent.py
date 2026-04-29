from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("ADMETAgent")


def compute_admet(smiles: str) -> dict:
    """Compute ADMET properties using RDKit descriptors."""
    try:
        from rdkit import Chem
        from rdkit.Chem import Descriptors, Lipinski
        from rdkit.Chem import rdMolDescriptors

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {}

        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        hbd = Lipinski.NumHDonors(mol)
        hba = Lipinski.NumHAcceptors(mol)
        tpsa = rdMolDescriptors.CalcTPSA(mol)
        rotatable = rdMolDescriptors.CalcNumRotatableBonds(mol)

        # Lipinski rule of 5 scoring
        ro5_violations = sum([
            mw > 500,
            logp > 5,
            hbd > 5,
            hba > 10,
        ])

        # Normalize scores to 0-1 range
        absorption = max(0, 1 - ro5_violations * 0.25)
        distribution = min(1, max(0, (logp + 2) / 7))
        metabolism = max(0, 1 - rotatable * 0.05)
        excretion = min(1, max(0, 1 - tpsa / 200))
        toxicity = max(0, 1 - (logp > 4) * 0.3 - (mw > 500) * 0.2)

        return {
            "absorption": round(absorption, 2),
            "distribution": round(distribution, 2),
            "metabolism": round(metabolism, 2),
            "excretion": round(excretion, 2),
            "toxicity": round(toxicity, 2),
            "mw": round(mw, 1),
            "tpsa": round(tpsa, 1),
            "logP": round(logp, 2),
        }
    except Exception as e:
        logger.error(f"ADMET computation failed: {e}")
        return {}


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("ADMETAgent:running:Computing ADMET properties...")
    docking = state.get("docking_results")
    if not docking:
        raise ValueError("ADMETAgent: Missing 'docking_results' from DockingAgent - cannot compute ADMET properties")

    admet_data = {}
    for compound in docking:
        smiles = compound.get("smiles")
        name = compound.get("name")
        if smiles and name:
            admet_data[name] = compute_admet(smiles)

    state["admet_scores"] = admet_data
    count = len(admet_data)
    state["step_updates"].append(f"ADMETAgent:complete:Computed ADMET for {count} compound(s)")
    return state
