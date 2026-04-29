from typing import List, Dict
from utils.logger import get_logger

logger = get_logger("results_filter")


def filter_results(results: List[Dict]) -> List[Dict]:
    """
    Filter docking results by binding quality.
    
    Removes:
    - Entries with affinity=None (failed docking)
    - Entries with affinity > -5.0 (weak binding)
    
    Args:
        results: List of docking result dicts with 'affinity' key
        
    Returns:
        List of filtered results, keeping only strong binders (affinity <= -5.0)
    """
    if not results:
        logger.warning("Empty results list provided")
        return []
    
    original_count = len(results)
    
    # Filter: affinity not None AND affinity <= -5.0
    filtered = [
        r for r in results
        if r.get("affinity") is not None and r["affinity"] <= -5.0
    ]
    
    removed_count = original_count - len(filtered)
    
    logger.info(
        f"Filter applied: {original_count} → {len(filtered)} results "
        f"({removed_count} removed: None or affinity > -5.0)"
    )
    
    return filtered
