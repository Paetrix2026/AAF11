import os
import subprocess
import tempfile
from typing import List
from pipeline.state import PipelineState
from utils.logger import get_logger

logger = get_logger("MutationParserAgent")


def align_and_parse_mutations(sequences: List[str]) -> List[str]:
    """Use MAFFT to align sequences and identify mutations."""
    if not sequences or len(sequences) < 2:
        return []

    try:
        import shutil
        if not shutil.which("mafft"):
            logger.warning("MAFFT not found, skipping alignment")
            return []

        with tempfile.NamedTemporaryFile(mode="w", suffix=".fasta", delete=False) as f:
            for i, seq in enumerate(sequences):
                f.write(f">seq{i}\n{seq}\n")
            fasta_path = f.name

        result = subprocess.run(
            ["mafft", "--quiet", fasta_path],
            capture_output=True, text=True, timeout=60
        )
        os.unlink(fasta_path)

        if result.returncode != 0:
            return []

        # Parse aligned sequences
        aligned = {}
        current_id = None
        for line in result.stdout.strip().split("\n"):
            if line.startswith(">"):
                current_id = line[1:]
                aligned[current_id] = ""
            elif current_id:
                aligned[current_id] += line.strip()

        if len(aligned) < 2:
            return []

        seqs = list(aligned.values())
        ref = seqs[0]
        mutations = []
        for i, (r, q) in enumerate(zip(ref, seqs[1])):
            if r != q and r != "-" and q != "-":
                mutations.append(f"{r}{i+1}{q}")

        return mutations[:20]  # Cap at 20 mutations
    except Exception as e:
        logger.error(f"Mutation parsing failed: {e}")
        return []


def run(state: PipelineState) -> PipelineState:
    state["step_updates"].append("MutationParserAgent:running:Analyzing mutation profile...")
    sequences = state.get("sequences") or []
    mutations = align_and_parse_mutations(sequences)
    state["mutations"] = mutations
    count = len(mutations)
    state["step_updates"].append(f"MutationParserAgent:complete:Identified {count} mutation(s)")
    return state
