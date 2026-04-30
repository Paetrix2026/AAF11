import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from utils.docking_utils import ProteinPreparer, LigandPreparer, run_vina_docking, SCREENING_COMPOUNDS
import requests
import tempfile

async def diagnostic():
    print("--- Screening Diagnostic ---")
    
    pdb_id = "4WSB"
    url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
    resp = requests.get(url)
    pdb_content = resp.text

    with tempfile.TemporaryDirectory() as tmpdir:
        prep = ProteinPreparer()
        pdbqt = await prep.prepare(pdb_content, pdb_id, tmpdir)
        print(f"Protein {pdb_id} prepared.")
        
        l_prep = LigandPreparer()
        for compound in SCREENING_COMPOUNDS:
            print(f"Testing {compound['name']}...")
            try:
                l_pdbqt = os.path.join(tmpdir, f"{compound['name']}.pdbqt")
                l_prep.prepare(compound["smiles"], l_pdbqt)
                
                out_pdbqt = os.path.join(tmpdir, f"{compound['name']}_out.pdbqt")
                affinity, seed = run_vina_docking(
                    receptor_path=pdbqt,
                    ligand_path=l_pdbqt,
                    output_path=out_pdbqt,
                    center=(0, 0, 0),
                    size=(30, 30, 30),
                    exhaustiveness=8
                )
                print(f"  SUCCESS: {compound['name']} Affinity: {affinity}")
            except Exception as e:
                print(f"  FAILED: {compound['name']} -> {e}")

if __name__ == "__main__":
    asyncio.run(diagnostic())
