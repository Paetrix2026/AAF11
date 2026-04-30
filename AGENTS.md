# AGENTS.md — AI Agent Pipeline Documentation

## Overview

The Healynx pipeline uses LangGraph to orchestrate a sequence of specialized agents. Each agent receives the full `PipelineState` and returns an updated state.

## Pipeline Execution Order

```
PlannerAgent
    ↓
FetchAgent          (NCBI sequence retrieval)
    ↓
MutationParserAgent (MAFFT alignment + mutation scoring)
    ↓
StructurePrepAgent  (RCSB PDB fetch or precomputed cache)
    ↓
DockingAgent        (AutoDock Vina screening)
    ↓
ADMETAgent          (RDKit property prediction)
    ↓
PrecisionMedicineAgent (Patient safety cross-ref)
    ↓
ResistanceAgent     (ML-based resistance scoring)
    ↓
SelectivityAgent    (Off-target binding check)
    ↓
SimilaritySearchAgent (Historical case retrieval from DB)
    ↓
DecisionAgent       (Multi-criteria drug ranking)
    ↓
SimulationAgent     (Clinical outcome simulation)
    ↓
ExplainabilityAgent (Groq LLM synthesis → recommendation JSON)
    ↓
ReportAgent         (Final structured report)
```

## Agent Descriptions

### PlannerAgent
Plans which agents to execute based on input. Currently runs all agents for every request.

### FetchAgent
- Fetches genetic sequences from NCBI Entrez
- Caches results in-memory to avoid rate limits
- Requires: `NCBI_EMAIL`, optionally `NCBI_API_KEY`

### MutationParserAgent
- Aligns sequences using MAFFT (system binary)
- Extracts mutations as `{ref}{position}{alt}` strings
- Falls back to empty list if MAFFT not installed

### StructurePrepAgent
- Maps pathogen name to a PDB ID (e.g., H5N1 → 4WSB)
- Fetches PDB from RCSB or loads precomputed cache
- Converts to PDBQT via obabel for docking

### DockingAgent
- Screens 4 known antiviral compounds with AutoDock Vina
- Falls back to compound list (no affinity scores) if Vina/obabel unavailable
- System binary required: `vina`, `obabel`

### ADMETAgent
- Computes ADMET properties using RDKit
- Calculates absorption, distribution, metabolism, excretion, toxicity scores
- No system binary required

### PrecisionMedicineAgent
- Cross-references discovered drugs with the specific patient profile
- Identifies contraindications (e.g., heart failure + cardiotoxicity)
- Calculates a `patient_risk` score based on known medication interactions

### ResistanceAgent
- Loads `data/structures/mutation_resistance.json`
- Scores resistance probability per drug given detected mutations

### SelectivityAgent
- Loads `data/structures/off_target_proteins.json`
- Scores off-target binding (high score = selective = good)

### SimilaritySearchAgent
- Queries the `outcomes` table in Neon for similar historical cases
- Matches by pathogen name (ILIKE)

### DecisionAgent
- Ranks compounds based on binding affinity, resistance probability, and patient-specific risk.
- Calculates a weighted 'Decision Score' for clinical prioritization.

### SimulationAgent
- Performs lightweight clinical stability simulations.
- Predicts 'Time-to-Failure' and 'Predicted Outcome' (stable, decline, fail).

### ExplainabilityAgent
- Uses Groq (llama-3.3-70b-versatile) to synthesize a recommendation
- Generates structured JSON: primary drug, confidence, urgency, summaries
- Requires: `GROQ_API_KEY`

### ReportAgent
- Compiles final report JSON from all agent outputs
- This report is stored in `pipeline_runs.result` column

## State Schema

See `backend/pipeline/state.py` for the full `PipelineState` TypedDict.

## Streaming

Agent step updates are written to `state.step_updates` as:
```
"AgentName:status:message"
```

The SSE endpoint (`GET /api/stream/{run_id}`) polls `_runs` in-memory and sends updates as they arrive.

## Demo Mode

When pathogen contains "H5N1", `StructurePrepAgent` loads precomputed PDB from `public/precomputed/H5N1.pdb` if it exists. This avoids RCSB network calls during demos.
