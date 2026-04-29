# Healynx Backend — Virtual Environment Setup (PowerShell)
# Run this once from the backend\ directory:
#   powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Healynx Backend - Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pyVer = python --version 2>&1
    Write-Host "[1/3] Found $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Install Python 3.11+ first." -ForegroundColor Red
    exit 1
}

# Create venv
Write-Host "[2/3] Creating virtual environment at backend\.venv ..." -ForegroundColor Yellow
python -m venv .venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to create virtual environment." -ForegroundColor Red
    exit 1
}

# Activate and install
Write-Host "[3/3] Installing requirements ..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install requirements." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host " Venv is now active. To start the server:" -ForegroundColor White
Write-Host "   uvicorn main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
