import os
from typing import Optional
from rdkit import Chem
from rdkit.Chem import AllChem
from utils.logger import get_logger

logger = get_logger("ligand_prep")


def prepare_ligand(smiles: str, output_pdb: str) -> Optional[str]:
    """
    Prepare a ligand from SMILES string to PDB file using RDKit.
    
    Steps:
    1. Convert SMILES → RDKit Mol object
    2. Add hydrogens
    3. Generate 3D coordinates using ETKDGv3
    4. Optimize geometry using MMFF force field
    5. Save as PDB file
    
    Args:
        smiles: SMILES string representing the drug/ligand
        output_pdb: Path where PDB file should be saved
        
    Returns:
        str: Path to generated PDB file if successful
        None: If any step fails
    """
    try:
        # Step 1: Parse SMILES
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            logger.error(f"Failed to parse SMILES: {smiles}")
            return None
        
        logger.info(f"✓ Parsed SMILES: {Chem.MolToSmiles(mol)}")
        
        # Step 2: Add hydrogens
        mol = Chem.AddHs(mol)
        logger.info(f"✓ Added hydrogens ({mol.GetNumAtoms()} atoms)")
        
        # Step 3: Generate 3D coordinates using ETKDGv3
        etkdg_params = AllChem.ETKDGv3()
        etkdg_params.randomSeed = 42  # Deterministic
        result = AllChem.EmbedMolecule(mol, etkdg_params)
        
        if result != 0:
            logger.error(f"Failed to generate 3D coordinates (code: {result})")
            return None
        
        logger.info("✓ Generated 3D coordinates using ETKDGv3")
        
        # Step 4: Optimize geometry using MMFF force field
        mmff_props = AllChem.MMFFGetMoleculeProperties(mol)
        if mmff_props is None:
            logger.error("Failed to setup MMFF properties")
            return None
        
        ff = AllChem.MMFFGetMoleculeForceField(mol, mmff_props)
        if ff is None:
            logger.error("Failed to create MMFF force field")
            return None
        
        ff.Initialize()
        minimize_result = ff.Minimize(maxIts=500)
        
        if minimize_result != 0:
            logger.warning(f"MMFF optimization did not fully converge (code: {minimize_result})")
        else:
            logger.info("✓ MMFF geometry optimization converged")
        
        # Step 5: Save as PDB
        Chem.MolToPDBFile(mol, output_pdb)
        
        if not os.path.exists(output_pdb):
            logger.error(f"Failed to write PDB file: {output_pdb}")
            return None
        
        file_size = os.path.getsize(output_pdb)
        logger.info(f"✓ Saved ligand PDB: {output_pdb} ({file_size} bytes)")
        
        return output_pdb
    
    except Exception as e:
        logger.error(f"Ligand preparation failed: {e}")
        return None
