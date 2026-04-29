import os
import sqlite3
import pandas as pd
from pathlib import Path

# Paths
DATA_DIR = Path("backend/data/cosmic")
DB_PATH = DATA_DIR / "cosmic_index.db"
TSV_PATH = DATA_DIR / "cmc_export.tsv"

def force_index():
    if not TSV_PATH.exists():
        print(f"ERROR: TSV not found at {TSV_PATH}")
        return

    print(f"BUILDING: Starting manual index of {TSV_PATH}...")
    try:
        if DB_PATH.exists():
            os.remove(DB_PATH)
            
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE mutations (
                gene_name TEXT,
                primary_site TEXT,
                mutation_description TEXT,
                sample_name TEXT
            )
        """)
        
        # Read the first few lines to check columns
        header = pd.read_csv(TSV_PATH, sep='\t', nrows=5)
        print(f"Detected columns: {list(header.columns)}")
        
        # ACTUAL COLUMNS from your TSV:
        # GENE_NAME, DISEASE, Mutation Description AA
        cols_map = {
            'GENE_NAME': 'gene_name',
            'DISEASE': 'primary_site',
            'Mutation Description AA': 'mutation_description'
        }
        
        available = [c for c in cols_map.keys() if c in header.columns]
        print(f"Using columns: {available}")

        chunk_size = 50000
        count = 0
        for chunk in pd.read_csv(TSV_PATH, sep='\t', usecols=available, chunksize=chunk_size, low_memory=False):
            chunk = chunk.rename(columns=cols_map)
            # Add missing column if not available
            if 'sample_name' not in chunk.columns:
                chunk['sample_name'] = 'N/A'
                
            chunk.to_sql('mutations', conn, if_exists='append', index=False)
            count += len(chunk)
            print(f"  Indexed {count} records...", end='\r')

        print("\nPROGRESS: Creating indices...")
        cursor.execute("CREATE INDEX idx_gene ON mutations(gene_name)")
        cursor.execute("CREATE INDEX idx_site ON mutations(primary_site)")
        
        conn.commit()
        conn.close()
        print("SUCCESS: Indexing complete!")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    force_index()
