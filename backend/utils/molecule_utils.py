from typing import Optional


def smiles_to_inchi(smiles: str) -> Optional[str]:
    """Convert SMILES to InChI using RDKit."""
    try:
        from rdkit import Chem
        from rdkit.Chem.inchi import MolToInchi
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None
        return MolToInchi(mol)
    except Exception:
        return None


def get_molecular_weight(smiles: str) -> Optional[float]:
    """Get molecular weight from SMILES."""
    try:
        from rdkit import Chem
        from rdkit.Chem import Descriptors
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None
        return Descriptors.MolWt(mol)
    except Exception:
        return None
