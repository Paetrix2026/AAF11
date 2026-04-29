from rdkit import Chem
from rdkit.Chem import AllChem
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test")

smiles = "CC1=C(C=CC=C1)OC2=CC3=C(C=C2)N4CC(C(C4=O)O3)C5=CC=C(C=C5)F"
mol = Chem.MolFromSmiles(smiles)
mol = Chem.AddHs(mol)

logger.info("Attempting Stage 1 embedding...")
res = AllChem.EmbedMolecule(mol, AllChem.ETKDG(), maxAttempts=1000)

if res == -1:
    logger.info("Stage 1 failed. Attempting Stage 2 (Permissive)...")
    res = AllChem.EmbedMolecule(
        mol, 
        useRandomCoords=True, 
        ignoreSmoothingFailures=True,
        useExpTorsionAnglePrefs=True,
        useBasicKnowledge=True,
        randomSeed=42,
        maxAttempts=5000
    )

if res == -1:
    logger.error("Stage 2 failed.")
else:
    logger.info("Embedding SUCCESSFUL!")
