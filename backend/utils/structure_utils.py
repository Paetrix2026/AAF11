import os
import requests
import httpx
from typing import Optional
from utils.logger import get_logger

logger = get_logger("structure_utils")

def fetch_rcsb(pdb_id: str) -> Optional[str]:
    """Fetch PDB from RCSB."""
    if not pdb_id or len(pdb_id) != 4:
        return None
    try:
        url = f"https://files.rcsb.org/download/{pdb_id.upper()}.pdb"
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.text
    except Exception as e:
        logger.error(f"RCSB fetch error for {pdb_id}: {e}")
    return None

async def fetch_alphafold(accession: str) -> Optional[str]:
    """Fetch structure from AlphaFold DB via API."""
    headers = {"User-Agent": "Healynx-Clinical-Pipeline/1.0"}
    api_url = f"https://alphafold.ebi.ac.uk/api/prediction/{accession}"
    
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(api_url, headers=headers)
            if resp.status_code != 200:
                return None
            
            data = resp.json()
            if not data or not isinstance(data, list):
                return None
            
            pdb_url = data[0].get("pdbUrl")
            if not pdb_url:
                return None
            
            pdb_resp = await client.get(pdb_url, headers=headers)
            if pdb_resp.status_code == 200:
                return pdb_resp.text
    except Exception as e:
        logger.debug(f"AlphaFold fetch failed for {accession}: {e}")
    return None

async def fetch_esmfold(sequence: str) -> Optional[str]:
    """Predict structure using ESMFold."""
    if len(sequence) > 400:
        return None
    url = "https://api.esmatlas.com/foldSequence/v1/pdb/"
    headers = {"User-Agent": "Healynx-Clinical-Pipeline/1.0"}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, content=sequence, headers=headers)
            if resp.status_code == 200:
                return resp.text
    except Exception as e:
        logger.warning(f"ESMFold failed: {e}")
    return None

async def fetch_accession_for_gene(gene_name: str) -> Optional[str]:
    """Search UniProt for a gene name to get its primary human accession."""
    url = f"https://rest.uniprot.org/uniprotkb/search?query=gene:{gene_name}%20AND%20organism_id:9606&format=json&size=1"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("results"):
                    return data["results"][0].get("primaryAccession")
    except Exception as e:
        logger.debug(f"UniProt gene search failed for {gene_name}: {e}")
    return None

async def acquire_structure(identifier: str) -> Optional[str]:
    """
    Intelligently acquire PDB data for any identifier.
    Tries: Local Map -> RCSB -> AlphaFold (Direct) -> AlphaFold (via Gene Search)
    """
    if not identifier:
        return None
    
    # 1. Try Local Map first
    import json
    from pathlib import Path
    map_path = Path(__file__).parent.parent / "data" / "structures" / "target_pdb_map.json"
    if map_path.exists():
        try:
            with open(map_path, "r") as f:
                mapping = json.load(f)
            pdb_id = mapping.get(identifier) or mapping.get(identifier.upper())
            if pdb_id:
                data = fetch_rcsb(pdb_id)
                if data: return data
        except: pass

    # 2. Try RCSB (if it looks like a PDB ID)
    if len(identifier) == 4 and identifier.isalnum():
        data = fetch_rcsb(identifier)
        if data: return data

    # 3. Try AlphaFold (Accession or Gene)
    data = await fetch_alphafold(identifier)
    if data: return data
    
    # 4. Try UniProt Search (Gene or Disease)
    accession = await fetch_accession_for_gene(identifier)
    if not accession and " " in identifier:
        # Try searching by full text if gene-specific search fails
        url = f"https://rest.uniprot.org/uniprotkb/search?query={identifier}%20AND%20organism_id:9606&format=json&size=1"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("results"):
                        accession = data["results"][0].get("primaryAccession")
        except: pass

    if accession:
        data = await fetch_alphafold(accession)
        if data: return data
    
    return None
