import os
from typing import Optional
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("FetchAgent")

# Simple in-memory cache to avoid rate limiting
_sequence_cache: dict = {}


def fetch_sequences_ncbi(pathogen: str, variant: Optional[str]) -> list:
    """Fetch sequences from NCBI Entrez for the given pathogen."""
    cache_key = f"{pathogen}:{variant}"
    if cache_key in _sequence_cache:
        logger.info(f"Cache hit for {cache_key}")
        return _sequence_cache[cache_key]

    try:
        from Bio import Entrez, SeqIO
        email = os.getenv("NCBI_EMAIL", "user@example.com")
        api_key = os.getenv("NCBI_API_KEY")
        Entrez.email = email
        if api_key:
            Entrez.api_key = api_key

        query = f"{pathogen}[Organism]"
        if variant:
            query += f" AND {variant}[All Fields]"

        handle = Entrez.esearch(db="nucleotide", term=query, retmax=5)
        record = Entrez.read(handle)
        handle.close()

        ids = record.get("IdList", [])
        if not ids:
            return []

        seqs = []
        for seq_id in ids[:3]:
            try:
                fetch_handle = Entrez.efetch(db="nucleotide", id=seq_id, rettype="fasta", retmode="text")
                seq_record = next(SeqIO.parse(fetch_handle, "fasta"))
                seqs.append(str(seq_record.seq[:500]))  # Truncate for speed
                fetch_handle.close()
            except Exception as e:
                logger.warning(f"Failed to fetch sequence {seq_id}: {e}")

        _sequence_cache[cache_key] = seqs
        return seqs
    except Exception as e:
        logger.error(f"NCBI fetch failed: {e}")
        return []


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append(f"FetchAgent:running:Querying NCBI for {state['pathogen']} sequences...")
    sequences = fetch_sequences_ncbi(state["pathogen"], state.get("variant"))
    state["sequences"] = sequences
    count = len(sequences)
    state["step_updates"].append(f"FetchAgent:complete:Retrieved {count} sequence(s) from NCBI")
    return state
