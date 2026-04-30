import json
import os
from typing import List, Dict
from utils.llm_router import get_llm

async def fetch_uniprot_search(query: str) -> List[Dict]:
    """
    Search for high-impact clinical mutations using AI.
    Returns a list of mutations with the format 'Disease Mutation'.
    """
    try:
        llm = get_llm(provider="groq")
        prompt = f"""Search for high-impact clinical mutations related to '{query}'. 
        Return a JSON array of up to 5 objects. Each object must have:
        - id: a unique identifier (e.g. disease_mutation)
        - name: the disease and mutation combined (e.g. "Alzheimer's APP_A673V")
        - disease: the name of the disease/pathogen only
        - mutation: the mutation signature only (e.g. "A673V")
        - description: a short clinical description
        
        Respond ONLY with the JSON array."""
        
        response = await llm.ainvoke(prompt)
        results = json.loads(response.content.strip().replace("```json", "").replace("```", ""))
        
        formatted = []
        for r in results:
            formatted.append({
                "id": r.get("id"),
                "name": r.get("name"),
                "source": "online",
                "type": "mutation",
                "description": r.get("description"),
                "metadata": {
                    "disease": r.get("disease"),
                    "mutation": r.get("mutation")
                }
            })
        return formatted
    except Exception as e:
        print(f"ERROR: AI Mutation search failed: {e}")
        return []
