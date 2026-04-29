# Healynx - One-command dev environment setup (Windows PowerShell)
$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

$banner = @"

  _    _             _             
 | |  | |           | |            
 | |__| | ___  __ _ | | _   _ _ __ __  __
 |  __  |/ _ \/ _` || || | | | '_ \\ \/ /
 | |  | |  __/ (_| || || |_| | | | |>  < 
 |_|  |_|\___|\__,_||_| \__, |_| |_/_/\_\
                         __/ |           
                        |___/            
  Dev Environment Setup
"@
Write-Host $banner -ForegroundColor Cyan

# Step 1: Python check
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow
try {
    $pyVer = python --version 2>&1
    Write-Host "      Found: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Python not found." -ForegroundColor Red
    Write-Host "      Install Python 3.11+ from https://python.org then re-run this script." -ForegroundColor Red
    exit 1
}

# Step 2: Create venv
$venvPath   = Join-Path $projectRoot "backend\.venv"
$activatePs = Join-Path $venvPath "Scripts\Activate.ps1"

Write-Host "[2/4] Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path $venvPath) {
    Write-Host "      .venv already exists - skipping creation." -ForegroundColor DarkYellow
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

# Upgrade pip
python -m pip install --upgrade pip --quiet

# Install backend requirements
$reqFile = Join-Path $projectRoot "backend\requirements.txt"
Write-Host "      Installing Python packages..." -ForegroundColor DarkCyan
pip install -r $reqFile --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: pip install failed." -ForegroundColor Red
    exit 1
}
Write-Host "      Python packages installed." -ForegroundColor Green

# Step 3: Node.js dependencies
Write-Host "[3/4] Installing Node.js dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $projectRoot "node_modules"
if (Test-Path $nodeModules) {
    Write-Host "      node_modules already exists - skipping." -ForegroundColor DarkYellow
} else {
    Set-Location $projectRoot
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      ERROR: npm install failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "      Node packages installed." -ForegroundColor Green
}

# Step 4: Shell auto-activation
Write-Host "[4/4] Configuring auto-activation..." -ForegroundColor Yellow
$addProfileScript = Join-Path $projectRoot "backend\Add-VenvToProfile.ps1"
if (Test-Path $addProfileScript) { & $addProfileScript }
$addCmdScript = Join-Path $projectRoot "backend\Add-CmdAutoRun.ps1"
if (Test-Path $addCmdScript) { & $addCmdScript }

Write-Host "`n  Setup complete!" -ForegroundColor Green
