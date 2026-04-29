import asyncio
import json
import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from pathlib import Path
from utils.fetch_utils import fetch_uniprot_search
from utils.cosmic_search import search_cosmic_local
from utils.logger import get_logger

logger = get_logger("search_router")
router = APIRouter()

# Cache Configuration
CACHE_FILE = Path(__file__).parent.parent / "data" / "search_cache.json"
CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

class SearchResult(BaseModel):
    id: str
    name: str
    source: str
    type: str
    description: Optional[str] = None
    metadata: Dict = {}

class APIResponse(BaseModel):
    success: bool
    data: List[SearchResult]
    message: str

def load_cache() -> Dict[str, List[Dict]]:
    if not CACHE_FILE.exists():
        return {}
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_to_cache(query: str, results: List[SearchResult]):
    cache = load_cache()
    q = query.lower().strip()
    cache[q] = [r.dict() for r in results]
    try:
        if len(cache) > 100:
            first_key = next(iter(cache))
            del cache[first_key]
        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Cache save failed: {e}")

@router.get("/search/local", response_model=APIResponse)
async def search_local(q: str = ""):
    """Instant local search (COSMIC/Cache)."""
    if not q or len(q) < 2:
        return APIResponse(success=True, data=[], message="Query too short")
    
    q_norm = q.lower().strip()
    
    # Check cache first
    cache = load_cache()
    if q_norm in cache:
        results = [SearchResult(**r) for r in cache[q_norm]]
        return APIResponse(success=True, data=results, message="Cached")

    # Local database search
    results = await search_cosmic_local(q)
    formatted = [SearchResult(**r) if isinstance(r, dict) else r for r in results]
    print(f"LOCAL SEARCH: Found {len(formatted)} results for '{q}'")
    return APIResponse(success=True, data=formatted, message="Local search complete")

@router.get("/search/online", response_model=APIResponse)
async def search_online(q: str = ""):
    """Deep online search (UniProt)."""
    if not q or len(q) < 2:
        return APIResponse(success=True, data=[], message="Query too short")
    
    print(f"DEBUG: Starting Online Search for '{q}'...")
    try:
        results = await fetch_uniprot_search(q)
        formatted = []
        for r in results:
            try:
                if isinstance(r, dict):
                    formatted.append(SearchResult(**r))
                else:
                    formatted.append(r)
            except Exception as e:
                print(f"ERROR: Failed to validate search result: {e}")
                continue
        
        # Save to cache for future local hits
        if formatted:
            save_to_cache(q, formatted)
            
        return APIResponse(success=True, data=formatted, message="Online search complete")
    except Exception as e:
        print(f"ERROR: Online search failed: {e}")
        return APIResponse(success=False, data=[], message=f"Online search error: {str(e)}")

# Keep the hybrid endpoint for backward compatibility
@router.get("/search", response_model=APIResponse)
async def search_hybrid(q: str = ""):
    local = await search_cosmic_local(q)
    online = await fetch_uniprot_search(q)
    all_results = local + online
    formatted = [SearchResult(**r) if isinstance(r, dict) else r for r in all_results]
    return APIResponse(success=True, data=formatted, message="Hybrid search complete")
