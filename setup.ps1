# Healynx — One-command dev environment setup (Windows PowerShell)
#
# Run this ONCE after cloning the repo:
#   powershell -ExecutionPolicy Bypass -File setup.ps1
#
# What this does:
#   1. Creates backend\.venv (Python virtual environment)
#   2. Installs all Python dependencies from backend\requirements.txt
#   3. Installs Node.js dependencies (npm install)
#   4. Patches your PowerShell profile so the venv auto-activates
#      whenever you open a terminal in this project folder

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot   # Always the folder this script lives in, regardless of clone path

Write-Host ""
Write-Host "  ██╗  ██╗███████╗ █████╗ ██╗  ██╗   ██╗███╗  ██╗██╗  ██╗" -ForegroundColor Cyan
Write-Host "  ██║  ██║██╔════╝██╔══██╗██║  ╚██╗ ██╔╝████╗ ██║╚██╗██╔╝" -ForegroundColor Cyan
Write-Host "  ███████║█████╗  ███████║██║   ╚████╔╝ ██╔██╗██║ ╚███╔╝ " -ForegroundColor Cyan
Write-Host "  ██╔══██║██╔══╝  ██╔══██║██║    ╚██╔╝  ██║╚████║ ██╔██╗ " -ForegroundColor Cyan
Write-Host "  ██║  ██║███████╗██║  ██║███████╗██║   ██║ ╚███║██╔╝╚██╗" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚══╝╚═╝  ╚═╝" -ForegroundColor Cyan
Write-Host "  Dev Environment Setup" -ForegroundColor DarkCyan
Write-Host ""

# ── Step 1: Python check ──────────────────────────────────────────────────────
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
try {
    $pyVer = python --version 2>&1
    Write-Host "      Found: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Python not found." -ForegroundColor Red
    Write-Host "      Install Python 3.11+ from https://python.org then re-run this script." -ForegroundColor Red
    exit 1
}

# ── Step 2: Create venv ───────────────────────────────────────────────────────
$venvPath   = Join-Path $projectRoot "backend\.venv"
$activatePs = Join-Path $venvPath "Scripts\Activate.ps1"
$activateBat = Join-Path $venvPath "Scripts\activate.bat"

Write-Host "[2/4] Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path $venvPath) {
    Write-Host "      .venv already exists — skipping creation." -ForegroundColor DarkYellow
} else {
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERROR: Failed to create venv." -ForegroundColor Red
        exit 1
    }
    Write-Host "      Created: $venvPath" -ForegroundColor Green
}

# Activate for this session
& $activatePs

# Upgrade pip silently
python -m pip install --upgrade pip --quiet

# Install backend requirements
$reqFile = Join-Path $projectRoot "backend\requirements.txt"
Write-Host "      Installing Python packages (this may take a few minutes)..." -ForegroundColor DarkCyan
pip install -r $reqFile --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: pip install failed." -ForegroundColor Red
    exit 1
}
Write-Host "      Python packages installed." -ForegroundColor Green

# ── Step 3: Node.js dependencies ─────────────────────────────────────────────
Write-Host "[3/4] Installing Node.js dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $projectRoot "node_modules"
if (Test-Path $nodeModules) {
    Write-Host "      node_modules already exists — skipping." -ForegroundColor DarkYellow
} else {
    Set-Location $projectRoot
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERROR: npm install failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "      Node packages installed." -ForegroundColor Green
}

# ── Step 4: Shell auto-activation (PowerShell + CMD) ────────────────────────
Write-Host "[4/4] Configuring auto-activation (PowerShell + CMD)..." -ForegroundColor Yellow
$addProfileScript = Join-Path $projectRoot "backend\Add-VenvToProfile.ps1"
& $addProfileScript
$addCmdScript = Join-Path $projectRoot "backend\Add-CmdAutoRun.ps1"
& $addCmdScript

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "   Setup complete!" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Fill in your secrets:" -ForegroundColor White
Write-Host "       .env.local          <- DATABASE_URL, NEXT_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "       backend\.env        <- DATABASE_URL, GROQ_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Push schema to Neon (first time only):" -ForegroundColor White
Write-Host "       npm run db:push" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Seed demo data (first time only):" -ForegroundColor White
Write-Host "       cd backend  ->  python db\seed.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Start the backend:" -ForegroundColor White
Write-Host "       cd backend  ->  uvicorn main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Start the frontend (new terminal):" -ForegroundColor White
Write-Host "       npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  From now on: open any terminal in this folder" -ForegroundColor DarkCyan
Write-Host "  and the venv activates automatically." -ForegroundColor DarkCyan
Write-Host ""
