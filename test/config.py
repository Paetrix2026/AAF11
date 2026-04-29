import os
from pathlib import Path

# Base directory for tests
TEST_DIR = Path(__file__).parent.absolute()

# Paths
MOCK_DATA_DIR = TEST_DIR / "mock_data"
OUTPUTS_DIR = TEST_DIR / "outputs"
LOGS_DIR = TEST_DIR / "logs"

# Ensure directories exist
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Flags
DEBUG_MODE = True
MOCK_EXTERNAL_APIS = True

# Environment Variables Setup (if any)
os.environ["HEALYNX_TEST_ENV"] = "true"
