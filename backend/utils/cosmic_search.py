import os
import sqlite3
import pandas as pd
from pathlib import Path
from typing import List, Dict
import threading

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "cosmic"
DB_PATH = DATA_DIR / "cosmic_index.db"
TSV_PATH = DATA_DIR / "cmc_export.tsv"

_indexing_lock = threading.Lock()
_is_indexing = False

def build_index():
    """Index the large TSV into SQLite for fast searching."""
    global _is_indexing
    if not TSV_PATH.exists():
        return
    
    with _indexing_lock:
        if _is_indexing:
            return
        _is_indexing = True

    try:
        print(f"BUILDING: Starting COSMIC local index from {TSV_PATH}...")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create table with index
        cursor.execute("DROP TABLE IF EXISTS mutations")
        cursor.execute("""
            CREATE TABLE mutations (
                gene_name TEXT,
                primary_site TEXT,
                mutation_description TEXT,
                sample_name TEXT
            )
        """)
        
        # Read in chunks to avoid memory issues (1.7GB is big)
        chunk_size = 100000
        # Read header to detect columns flexibly
        header = pd.read_csv(TSV_PATH, sep='\t', nrows=0)
        cols_in_file = header.columns.tolist()
        
        # Flexibly find columns
        def find_col(keywords):
            for col in cols_in_file:
                if any(k.upper() in col.upper() for k in keywords):
                    return col
            return None

        gene_col = find_col(['GENE_NAME', 'Gene name']) or cols_in_file[0]
        site_col = find_col(['DISEASE', 'Primary site']) or cols_in_file[1]
        mut_col = find_col(['Mutation Description AA', 'Mutation Description']) or cols_in_file[2]
        
        print(f"DEBUG: Found columns - Gene: {gene_col}, Site: {site_col}, Mutation: {mut_col}")

        cols_map = {
            gene_col: 'gene_name',
            site_col: 'primary_site',
            mut_col: 'mutation_description'
        }
        
        count = 0
        for chunk in pd.read_csv(TSV_PATH, sep='\t', usecols=list(cols_map.keys()), chunksize=chunk_size, low_memory=False):
            chunk = chunk.rename(columns=cols_map)
            if 'sample_name' not in chunk.columns:
                chunk['sample_name'] = 'N/A'
            chunk.to_sql('mutations', conn, if_exists='append', index=False)
            count += len(chunk)
            print(f"  Indexed {count} records...", end='\r')

        # Create search index
        print("  Creating SQL indices...")
        cursor.execute("CREATE INDEX idx_gene ON mutations(gene_name)")
        cursor.execute("CREATE INDEX idx_site ON mutations(primary_site)")
        
        conn.commit()
        conn.close()
        print("SUCCESS: COSMIC indexing complete.")
    except Exception as e:
        print(f"ERROR: COSMIC indexing failed: {e}")
    finally:
        _is_indexing = False

async def search_cosmic_local(query: str) -> List[Dict]:
    """Search the local SQLite index."""
    if not DB_PATH.exists():
        if TSV_PATH.exists():
            # Trigger background indexing
            threading.Thread(target=build_index, daemon=True).start()
        return []

    try:
        # Use a separate connection per search for thread safety in async
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Search by gene name or site
        search_query = f"%{query}%"
        cursor.execute("""
            SELECT DISTINCT gene_name, primary_site, mutation_description 
            FROM mutations 
            WHERE gene_name LIKE ? OR primary_site LIKE ? 
            LIMIT 10
        """, (search_query, search_query))
        
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            results.append({
                "id": f"COSMIC:{row['gene_name']}",
                "name": f"{row['gene_name']} ({row['primary_site']})",
                "source": "local",
                "type": "gene",
                "description": f"Somatic Mutation: {row['mutation_description']}",
                "metadata": {
                    "site": row['primary_site'],
                    "gene": row['gene_name']
                }
            })
        return results
    except Exception as e:
        print(f"Local search error: {e}")
        return []
