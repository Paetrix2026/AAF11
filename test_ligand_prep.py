#!/usr/bin/env python
"""Test ligand preparation directly without API."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from rdkit import Chem
from rdkit.Chem import AllChem
import tempfile

def test_ligand_prep(smiles: str, name: str) -> dict:
    """Test 3D structure generation."""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"SMILES: {smiles}")
    print(f"{'='*60}")
    
    try:
        # Parse
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            print("❌ Failed to parse SMILES")
            return {"status": "failed", "reason": "parse_error"}
        
        print(f"✓ Parsed SMILES (atoms: {mol.GetNumAtoms()})")
        
        # Add hydrogens
        mol = Chem.AddHs(mol)
        print(f"✓ Added hydrogens (atoms: {mol.GetNumAtoms()})")
        
        # Try ETKDG v3 (correct API)
        print("Attempting ETKDG v3 embedding...")
        params = AllChem.ETKDGv3()
        params.randomSeed = 42
        params.maxAttempts = 1000
        
        result = AllChem.EmbedMolecule(mol, params)
        
        if result == -1:
            print("❌ ETKDG v3 failed")
            return {"status": "failed", "reason": "etkdg_failed"}
        
        print(f"✓ ETKDG v3 succeeded")
        
        # Optimize with MMFF
        print("Optimizing with MMFF...")
        props = AllChem.MMFFGetMoleculeProperties(mol)
        if props is None:
            print("⚠ MMFF properties failed, using UFF")
            ff = AllChem.UFFGetMoleculeForceField(mol)
        else:
            ff = AllChem.MMFFGetMoleculeForceField(mol, props)
        
        if ff is not None:
            ff.Initialize()
            minimize_result = ff.Minimize(maxIts=2000)
            print(f"✓ Minimization converged: {minimize_result == 0}")
        
        # Save PDB
        with tempfile.NamedTemporaryFile(suffix=".pdb", delete=False) as f:
            output_path = f.name
        
        AllChem.MolToPDBFile(mol, output_path)
        file_size = os.path.getsize(output_path)
        
        print(f"✓ PDB generated: {output_path}")
        print(f"✓ File size: {file_size} bytes")
        
        return {
            "status": "success",
            "compound": name,
            "smiles": smiles,
            "atoms": mol.GetNumAtoms(),
            "pdb_path": output_path,
            "pdb_size": file_size
        }
        
    except Exception as e:
        print(f"❌ Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "failed", "reason": str(e)}


# Test compounds
test_compounds = [
    ("CCOC(=O)C1=C[C@@H](OC(CC)CC)[C@H](NC(C)=O)[C@@H](N)C1", "Oseltamivir"),
    ("CC(=O)N[C@@H]([C@H](O)[C@H](O)CO)[C@@H]1OC(C[C@H]1N=C(N)N)=C(O)O", "Zanamivir"),
    ("CC1=C(C=CC=C1)OC2=CC3=C(C=C2)N4CC(C(C4=O)O3)C5=CC=C(C=C5)F", "Baloxavir"),
]

print("\n" + "="*60)
print("RDKit Ligand Preparation Test Suite")
print("="*60)

results = []
for smiles, name in test_compounds:
    result = test_ligand_prep(smiles, name)
    results.append(result)

print("\n" + "="*60)
print("SUMMARY")
print("="*60)

for r in results:
    status_icon = "✓" if r["status"] == "success" else "❌"
    print(f"{status_icon} {r.get('compound', 'Unknown')}: {r['status']}")
    if r["status"] != "success":
        print(f"   Reason: {r.get('reason', 'Unknown')}")
    else:
        print(f"   Atoms: {r['atoms']}, PDB: {r['pdb_size']} bytes")

print("\n" + "="*60)
print("RDKit version info:")
print(f"RDKit: {Chem.rdBase.rdkitVersion}")
print("="*60)
