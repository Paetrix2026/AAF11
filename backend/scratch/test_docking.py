import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from utils.docking_utils import ProteinPreparer, LigandPreparer, run_vina_docking
import requests
import tempfile

async def diagnostic():
    print("--- Docking Diagnostic ---")
    
    # 1. Test Protein Fetch
    pdb_id = "4WSB"
    url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"FAILED: Could not fetch {pdb_id}")
        return
    pdb_content = resp.text
    print(f"SUCCESS: Fetched {pdb_id}")

    # 2. Test Protein Prep
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            prep = ProteinPreparer()
            pdbqt = await prep.prepare(pdb_content, pdb_id, tmpdir)
            print(f"SUCCESS: Prepared protein at {pdbqt}")
            
            # 3. Test Ligand Prep
            smiles = "CCC(CC)OC1C=C(CC(C1N)NC(=O)C)C(=O)OCC" # Oseltamivir
            l_prep = LigandPreparer()
            l_pdbqt = os.path.join(tmpdir, "ligand.pdbqt")
            l_prep.prepare(smiles, l_pdbqt)
            print(f"SUCCESS: Prepared ligand at {l_pdbqt}")
            
            # 4. Test Docking
            out_pdbqt = os.path.join(tmpdir, "out.pdbqt")
            affinity, seed = run_vina_docking(
                receptor_path=pdbqt,
                ligand_path=l_pdbqt,
                output_path=out_pdbqt,
                center=(0, 0, 0),
                size=(30, 30, 30),
                exhaustiveness=8
            )
            print(f"SUCCESS: Docking finished. Affinity: {affinity}")
            
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(diagnostic())
