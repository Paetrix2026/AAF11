from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor
from utils.logger import get_logger
from utils.dock_single import dock_single_ligand

logger = get_logger("dock_batch")


def dock_batch(
    smiles_list: List[str],
    receptor_pdbqt: str,
    grid_config: Dict[str, float]
) -> List[Dict]:
    """
    Dock multiple ligands in parallel using ThreadPoolExecutor.
    
    Orchestrates batch docking with:
    - Parallel execution (4 workers)
    - Result collection
    - Sorting by binding affinity
    - Filtering successful docks only
    
    Args:
        smiles_list: List of SMILES strings to dock
        receptor_pdbqt: Path to prepared receptor PDBQT file
        grid_config: Dict with center_x/y/z and size_x/y/z
        
    Returns:
        List of docking results sorted by affinity (ascending/best first).
        Only successful docks included (status="success").
        
        Each result dict:
        {
            "smiles": str,
            "affinity": float,
            "status": "success"
        }
    """
    if not smiles_list:
        logger.warning("Empty SMILES list provided")
        return []
    
    logger.info(f"Starting batch docking: {len(smiles_list)} compounds, 4 workers")
    
    all_results = []
    
    try:
        # Execute docking in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(dock_single_ligand, smiles, receptor_pdbqt, grid_config)
                for smiles in smiles_list
            ]
            
            # Collect results as they complete
            for i, future in enumerate(futures, 1):
                try:
                    result = future.result()
                    all_results.append(result)
                    logger.debug(f"[{i}/{len(smiles_list)}] Received: {result['status']}")
                except Exception as e:
                    logger.error(f"Failed to retrieve result {i}: {e}")
        
        # Filter: only successful docks
        successful = [r for r in all_results if r["status"] == "success"]
        
        # Sort by affinity ascending (lower = better binding)
        successful.sort(key=lambda x: x["affinity"])
        
        logger.info(
            f"Batch complete: {len(successful)}/{len(all_results)} successful. "
            f"Best affinity: {successful[0]['affinity']:.2f} kcal/mol" if successful else "No successful docks"
        )
        
        return successful
    
    except Exception as e:
        logger.error(f"Batch docking error: {e}")
        return []
