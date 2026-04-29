# Healynx Backend Testing Environment

This directory contains a dedicated testing and experimentation environment for the Healynx backend agents.

## 📁 Structure

- `main_test.py`: The entry point to run the simplified test pipeline.
- `config.py`: Configuration and environment setup for tests.
- `mock_data/`: Contains sample inputs for testing.
- `agents/`: Test versions of the Healynx agents (`Decision`, `Simulation`, `Recommendation`).
- `utils/`: Helper functions for scoring and normalization.
- `outputs/`: Stores the results of test runs as JSON.
- `logs/`: Debug logs generated during execution.

## 🚀 How to Run

From the project root directory, run:

```bash
python test/main_test.py
```

## ⚙️ Rules

1. **Isolation**: All test execution must happen within this folder.
2. **No Frontend**: Do not import any frontend code.
3. **Mocking**: External API calls should be mocked or avoided.
4. **Outputs**: All results must be saved in `test/outputs/`.

## 🧪 Pipeline Flow

1. **Input**: Loads mutation and patient data from `test/mock_data/sample_input.json`.
2. **DecisionAgent**: Filters drugs based on binding affinity.
3. **SimulationAgent**: Calculates risk scores based on patient profile and drug characteristics.
4. **RecommendationAgent**: Generates final drug recommendations with urgency and risk levels.
5. **Output**: Saves the final report to `test/outputs/test_run_results.json`.
