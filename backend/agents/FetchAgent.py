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
                params={"query": f"{pathogen} AND (organism_id:9606)", "format": "json", "size": 3},
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


async def fetch_pubchem(compound_name: str) -> List[Dict]:
    """Fetch specific compound data from PubChem."""
    import urllib.parse
    encoded_name = urllib.parse.quote(compound_name)
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            # Try name lookup first
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded_name}/property/CanonicalSMILES,IsomericSMILES,Title/JSON"
            r = await client.get(url)
            
            if r.status_code != 200:
                # Fallback: Try CID search if name fails (common for some synonyms)
                cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded_name}/cids/JSON"
                cid_r = await client.get(cid_url)
                if cid_r.status_code == 200:
                    cid = cid_r.json().get("IdentifierList", {}).get("CID", [None])[0]
                    if cid:
                        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/CanonicalSMILES,IsomericSMILES,Title/JSON"
                        r = await client.get(url)
            
            if r.status_code != 200:
                return []
            
            props = r.json().get("PropertyTable", {}).get("Properties", [])
            results = []
            for p in props[:5]:
                smiles = p.get("CanonicalSMILES") or p.get("IsomericSMILES") or p.get("SMILES")
                results.append({
                    "name": p.get("Title") or compound_name,
                    "smiles": smiles
                })
            return results
        except Exception as e:
            logger.warning(f"PubChem fetch failed for {compound_name}: {e}")
            return []

async def research_targets(condition: str) -> Dict:
    """Use AI to identify biological targets and known drugs for a condition."""
    from utils.llm_router import get_llm
    # Temporarily using groq as it is confirmed working in the current environment
    llm = get_llm(provider="groq")
    
    prompt = f"""
    Act as a molecular biologist and clinical pharmacologist. 
    For the medical condition: '{condition}', identify:
    1. The top 2-3 primary protein targets (use UniProt primary names or Gene names like 'MTOR', 'EGFR', 'IGF1R').
    2. The top 3-4 known therapeutic compounds, FDA-approved drugs, or advanced experimental inhibitors used for this specific condition.
    
    Return ONLY a valid JSON object with this exact structure:
    {{
      "targets": ["GeneName1", "GeneName2"],
      "compounds": ["DrugName1", "DrugName2", "DrugName3"]
    }}
    
    Ensure the compound names are common names (e.g., 'Everolimus', not 'RAD001').
    Respond ONLY with the JSON object.
    """
    try:
        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        
        # Cleanup JSON
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        import json
        data = json.loads(content)
        logger.info(f"AI Research for {condition}: Found targets {data.get('targets')} and compounds {data.get('compounds')}")
        return data
    except Exception as e:
        logger.error(f"AI Research failed for {condition}: {e}. Falling back to default targets.")
        return {"targets": [condition], "compounds": []}

async def run(state: PipelineState) -> PipelineState:
    pathogen = state["pathogen"]
    state["step_updates"].append(f"FetchAgent:running:Initiating AI research for {pathogen}...")
    
    research = await research_targets(pathogen)
    targets = research.get("targets", [])
    compounds = research.get("compounds", [])
    
    if not targets: targets = [pathogen]
    
    state["step_updates"].append(f"FetchAgent:running:Discovered targets: {', '.join(targets)}. Fetching molecular data...")

    lit_task = fetch_pubmed(pathogen)
    prot_tasks = [fetch_uniprot(t) for t in targets]
    chem_tasks = [fetch_pubchem(c) for c in compounds]
    
    results = await asyncio.gather(lit_task, *prot_tasks, *chem_tasks)
    
    lit = results[0]
    prot = []
    prot_results = [p for p in results[1 : 1+len(targets)] if p is not None]
    for i in range(len(prot_results)):
        prot.extend(prot_results[i])
        
    chem = []
    # results[1 + len(targets) : ]
    for i in range(len(compounds)):
        found = results[1+len(targets)+i]
        # Filter out compounds without SMILES (like large proteins)
        valid = [c for c in found if c.get("name") and c.get("smiles")]
        chem.extend(valid)
    
    if not chem:
        # Fallback to general inhibitor search
        found = await fetch_pubchem(f"{pathogen} inhibitor")
        chem = [c for c in found if c.get("name") and c.get("smiles")]

    state["literature"] = lit
    state["proteins"] = prot
    state["known_compounds"] = chem
    
    if prot:
        state["sequences"] = [p["sequence"] for p in prot if p.get("sequence")]
    
    state["step_updates"].append(f"FetchAgent:complete:Retrieved {len(lit)} papers, {len(prot)} proteins, and {len(chem)} compounds")
    return state
