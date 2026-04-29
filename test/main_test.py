import os
import sys
import json
from pathlib import Path

# Setup paths
TEST_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = TEST_DIR.parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"

# Add backend to path to use production code
sys.path.insert(0, str(BACKEND_DIR))

# Import the new unified pipeline runner
from pipeline.runner import run_healynx_pipeline

def verify_stage4_integration():
    print("--- Starting Healynx Stage 4 System Integration Test ---")
    
    # 1. Unified Input Data
    input_data = {
        "mutation": "EGFR T790M",
        "patient_profile": {
            "heart_condition": True,
            "diabetes": False,
            "medications": ["Statin"]
        }
    }

    print(f"Unified Input: {json.dumps(input_data, indent=2)}")

    # 2. Run the single executable pipeline
    print("\n[Stage 4] Executing unified pipeline...")
    result = run_healynx_pipeline(input_data)

    # 3. Print results
    print("\n--- Pipeline Result ---")
    print(json.dumps(result, indent=2))

    # 4. Verify Logging
    log_dir = TEST_DIR / "logs"
    logs = list(log_dir.glob("pipeline_trace_*.log"))
    if logs:
        print(f"\n[Success] Debug trace found in: {logs[-1]}")
    else:
        print("\n[Error] No debug trace logs found!")

    # 5. Save final result
    output_path = TEST_DIR / "outputs" / "stage4_integration_results.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\nResults saved to: {output_path}")
    print("--- Stage 4 Integration Test Complete ---")

if __name__ == "__main__":
    verify_stage4_integration()
