import os
import asyncio
import httpx
from typing import Optional, List, Dict
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("FetchAgent")

UA = "Healynx-Pipeline/1.0 (Hackathon)"
TIMEOUT = 30


async def fetch_pubmed(query: str) -> List[Dict]:
    """Fetch relevant literature from PubMed."""
    api_key = os.getenv("NCBI_API_KEY")
    params = {
        "db": "pubmed",
        "term": query,
        "retmode": "json",
        "retmax": 5,
    }
    if api_key:
        params["api_key"] = api_key

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            r = await client.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params=params)
            ids = r.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []
            
            sum_r = await client.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
                params={"db": "pubmed", "id": ",".join(ids), "retmode": "json"},
            )
            data = sum_r.json().get("result", {})
            papers = []
            for pid in ids:
                item = data.get(pid, {})
                if item:
                    papers.append({
                        "id": pid,
                        "title": item.get("title", ""),
                        "source": item.get("source", ""),
                        "date": item.get("pubdate", "")
                    })
            return papers
        except Exception as e:
            logger.warning(f"PubMed fetch failed: {e}")
            return []


async def fetch_uniprot(pathogen: str) -> List[Dict]:
    """Fetch protein data from UniProt."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            r = await client.get(
                "https://rest.uniprot.org/uniprotkb/search",
                params={"query": pathogen, "format": "json", "size": 3},
            )
            results = r.json().get("results", [])
            proteins = []
            for item in results:
                proteins.append({
                    "accession": item.get("primaryAccession"),
                    "name": item.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value"),
                    "sequence": item.get("sequence", {}).get("value")
                })
            return proteins
        except Exception as e:
            logger.warning(f"UniProt fetch failed: {e}")
            return []


async def fetch_pubchem(pathogen: str) -> List[Dict]:
    """Fetch known inhibitors from PubChem."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            # Simple search for inhibitors
            r = await client.get(
                f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{pathogen} inhibitor/property/CanonicalSMILES,Title/JSON"
            )
            props = r.json().get("PropertyTable", {}).get("Properties", [])
            return [{"name": p.get("Title"), "smiles": p.get("CanonicalSMILES")} for p in props[:5]]
        except Exception:
            return []


async def run(state: PipelineState) -> PipelineState:
    pathogen = state["pathogen"]
    state["step_updates"].append(f"FetchAgent:running:Fetching data for {pathogen} from multi-source APIs...")
    
    # Parallel fetch
    lit, prot, chem = await asyncio.gather(
        fetch_pubmed(pathogen),
        fetch_uniprot(pathogen),
        fetch_pubchem(pathogen),
    )
    
    state["literature"] = lit
    state["proteins"] = prot
    state["known_compounds"] = chem
    
    # Extract sequences for next steps
    if prot:
        state["sequences"] = [p["sequence"] for p in prot if p.get("sequence")]
    
    state["step_updates"].append(f"FetchAgent:complete:Retrieved {len(lit)} papers, {len(prot)} proteins, and {len(chem)} compounds")
    return state
