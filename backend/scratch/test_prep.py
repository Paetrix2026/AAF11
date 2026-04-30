import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from utils.docking_utils import ProteinPreparer
import requests
import tempfile

async def diagnostic():
    print("--- Protein Prep Diagnostic ---")
    
    pdb_id = "4WSB"
    url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
    print(f"Fetching {pdb_id}...")
    resp = requests.get(url)
    pdb_content = resp.text
    print("Fetch complete.")

    with tempfile.TemporaryDirectory() as tmpdir:
        prep = ProteinPreparer()
        print("Starting prepare()...")
        # Inline the steps to see where it hangs
        
        pdb_path = os.path.join(tmpdir, "input.pdb")
        with open(pdb_path, "w") as f:
            f.write(pdb_content)
        print("Wrote input.pdb")

        centered_pdb = os.path.join(tmpdir, "centered.pdb")
        print("Starting _clean_and_center_pdb...")
        prep._clean_and_center_pdb(pdb_path, centered_pdb)
        print("Finished _clean_and_center_pdb")

        hydrogenated_pdb = os.path.join(tmpdir, "hydrogenated.pdb")
        print("Starting _add_hydrogens...")
        prep._add_hydrogens(centered_pdb, hydrogenated_pdb)
        print("Finished _add_hydrogens")

        pdbqt_path = os.path.join(tmpdir, "output.pdbqt")
        print("Starting _convert_to_pdbqt...")
        prep._convert_to_pdbqt(hydrogenated_pdb, pdbqt_path)
        print("Finished _convert_to_pdbqt")
        
        print("SUCCESS")

if __name__ == "__main__":
    asyncio.run(diagnostic())
