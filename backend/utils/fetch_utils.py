import httpx
from typing import List, Dict

async def fetch_uniprot_search(query: str) -> List[Dict]:
    """Fetch search results from UniProt."""
    url = "https://rest.uniprot.org/uniprotkb/search"
    params = {
        "query": query,
        "format": "json",
        "size": 5
    }
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return []
            
            results = r.json().get("results", [])
            formatted = []
            for item in results:
                try:
                    acc = item.get("primaryAccession")
                    # Safely get protein name
                    desc = item.get("proteinDescription", {})
                    # Try recommended name, then submission names
                    name_obj = desc.get("recommendedName") or desc.get("submissionNames", [{}])[0]
                    name = name_obj.get("fullName", {}).get("value", "Unknown Protein")
                    
                    # Safely get gene name
                    gene_list = item.get("genes", [])
                    gene = gene_list[0].get("geneName", {}).get("value", "N/A") if gene_list else "N/A"
                    
                    formatted.append({
                        "id": acc,
                        "name": f"{name} ({gene})",
                        "source": "online",
                        "type": "protein",
                        "description": f"UniProt Accession: {acc}",
                        "metadata": {
                            "organism": item.get("organism", {}).get("scientificName"),
                            "gene": gene
                        }
                    })
                except Exception as e:
                    print(f"WARNING: Skipping one UniProt result due to parsing error: {e}")
                    continue
            
            print(f"SUCCESS: UniProt returned {len(formatted)} valid results")
            return formatted
        except Exception as e:
            print(f"ERROR: UniProt fetch failed: {e}")
            return []
