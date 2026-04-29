#!/usr/bin/env python
"""End-to-end docking pipeline test."""

import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from utils.docking_utils import LigandPreparer, ProteinPreparer, run_vina_docking
from utils.grid_config import get_grid_config
import tempfile
import json

async def test_full_docking():
    """Test complete docking pipeline."""
    
    print("\n" + "="*70)
    print("FULL DOCKING PIPELINE TEST")
    print("="*70)
    
    # Test compounds
    compounds = [
        ("CCOC(=O)C1=C[C@@H](OC(CC)CC)[C@H](NC(C)=O)[C@@H](N)C1", "Oseltamivir"),
        ("CC(=O)N[C@@H]([C@H](O)[C@H](O)CO)[C@@H]1OC(C[C@H]1N=C(N)N)=C(O)O", "Zanamivir"),
    ]
    
    # Use precomputed H5N1 structure or download it
    receptor_pdb = "public/precomputed/H5N1.pdb"
    
    if not os.path.exists(receptor_pdb):
        print(f"⚠ Precomputed PDB not found, downloading from RCSB...")
        try:
            import urllib.request
            pdb_id = "4WSB"  # H5N1 neuraminidase
            url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
            
            os.makedirs("public/precomputed", exist_ok=True)
            urllib.request.urlretrieve(url, receptor_pdb)
            print(f"✓ Downloaded PDB {pdb_id} to {receptor_pdb}")
            
        except Exception as e:
            print(f"❌ Could not download PDB: {e}")
            print("   Running ligand prep only")
            test_ligand_prep_only(compounds)
            return
    
    print(f"✓ Using receptor: {receptor_pdb}")
    
    # 1. Prepare protein
    print("\n[1] PREPARING PROTEIN")
    print("-" * 70)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Read PDB file
        with open(receptor_pdb, "r") as f:
            pdb_content = f.read()
        
        protein_prep = ProteinPreparer()
        protein_pdbqt = await protein_prep.prepare(pdb_content, "H5N1", tmpdir)
        
        print(f"✓ Receptor prepared: {protein_pdbqt}")
        print(f"✓ File size: {os.path.getsize(protein_pdbqt)} bytes")
        
        # 2. Get grid config
        print("\n[2] COMPUTING GRID")
        print("-" * 70)
        
        try:
            grid_config = get_grid_config(receptor_pdb, size=22)
            print(f"✓ Grid center: ({grid_config['center_x']:.2f}, {grid_config['center_y']:.2f}, {grid_config['center_z']:.2f})")
            print(f"✓ Grid size: {grid_config['size_x']} × {grid_config['size_y']} × {grid_config['size_z']}")
        except Exception as e:
            print(f"❌ Grid computation failed: {e}")
            return
        
        # 3. Test ligand docking
        print("\n[3] DOCKING LIGANDS")
        print("-" * 70)
        
        results = []
        ligand_prep = LigandPreparer()
        
        for smiles, name in compounds:
            print(f"\nDocking: {name}")
            print(f"  SMILES: {smiles}")
            
            # Prepare ligand
            ligand_pdb = os.path.join(tmpdir, f"{name.lower().replace(' ', '_')}.pdb")
            
            if not ligand_prep.prepare(smiles, ligand_pdb):
                print(f"  ❌ Ligand preparation failed")
                results.append({
                    "compound": name,
                    "status": "failed",
                    "reason": "ligand_prep_failed"
                })
                continue
            
            print(f"  ✓ Ligand PDB: {os.path.getsize(ligand_pdb)} bytes")
            
            # Convert to PDBQT
            ligand_pdbqt = ligand_pdb.replace(".pdb", ".pdbqt")
            
            try:
                import subprocess
                obabel_path = "obabel"
                result = subprocess.run(
                    [obabel_path, ligand_pdb, "-O", ligand_pdbqt, "-p", "7.4"],
                    capture_output=True,
                    timeout=30
                )
                
                if result.returncode != 0:
                    print(f"  ❌ PDBQT conversion failed")
                    results.append({
                        "compound": name,
                        "status": "failed",
                        "reason": "pdbqt_conversion_failed"
                    })
                    continue
                
                print(f"  ✓ Ligand PDBQT: {os.path.getsize(ligand_pdbqt)} bytes")
                
            except Exception as e:
                print(f"  ❌ PDBQT conversion error: {e}")
                results.append({
                    "compound": name,
                    "status": "failed",
                    "reason": f"pdbqt_error: {str(e)}"
                })
                continue
            
            # Run Vina docking
            output_pdbqt = os.path.join(tmpdir, f"{name.lower().replace(' ', '_')}_docked.pdbqt")
            
            try:
                center = (grid_config['center_x'], grid_config['center_y'], grid_config['center_z'])
                size = (grid_config['size_x'], grid_config['size_y'], grid_config['size_z'])
                
                affinity, seed = run_vina_docking(protein_pdbqt, ligand_pdbqt, output_pdbqt, center, size)
                
                if affinity is None:
                    print(f"  ❌ Vina docking failed")
                    results.append({
                        "compound": name,
                        "status": "failed",
                        "reason": "vina_failed"
                    })
                    continue
                
                print(f"  ✓ Binding affinity: {affinity:.2f} kcal/mol (seed: {seed})")
                
                results.append({
                    "compound": name,
                    "status": "success",
                    "affinity": affinity,
                    "output_pdbqt": output_pdbqt
                })
                
            except Exception as e:
                print(f"  ❌ Docking error: {e}")
                results.append({
                    "compound": name,
                    "status": "failed",
                    "reason": f"docking_error: {str(e)}"
                })
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    for r in results:
        if r["status"] == "success":
            print(f"✓ {r['compound']}: {r['affinity']:.2f} kcal/mol")
        else:
            print(f"❌ {r['compound']}: {r.get('reason', 'unknown error')}")
    
    print("\n" + "="*70)


def test_ligand_prep_only(compounds):
    """Test ligand preparation without protein."""
    
    print("\n[LIGAND PREP ONLY - No receptor available]")
    print("-" * 70)
    
    ligand_prep = LigandPreparer()
    
    for smiles, name in compounds:
        print(f"\nTesting: {name}")
        
        with tempfile.NamedTemporaryFile(suffix=".pdb", delete=False) as f:
            output_pdb = f.name
        
        if ligand_prep.prepare(smiles, output_pdb):
            size = os.path.getsize(output_pdb)
            print(f"  ✓ Success: {size} bytes")
            os.unlink(output_pdb)
        else:
            print(f"  ❌ Failed")


if __name__ == "__main__":
    try:
        asyncio.run(test_full_docking())
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED]")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
