# Healynx Dataset Installation Script
# This script handles the download and indexing of the 1.7GB COSMIC dataset.

$DATA_DIR = "$PSScriptRoot/backend/data/cosmic"
$TSV_PATH = "$DATA_DIR/cmc_export.tsv"
# GOOGLE DRIVE ID: 1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd (1.7GB COSMIC TSV)

Write-Host "--- HEALYNX DATASET PROVISIONER ---" -ForegroundColor Cyan

# 1. Ensure directory exists
if (!(Test-Path $DATA_DIR)) {
    Write-Host "[+] Creating data directory: $DATA_DIR"
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
}

# 3. Download and Validation Loop
$attempts = 0
$maxAttempts = 3
$success = $false

while (!$success -and $attempts -lt $maxAttempts) {
    $attempts++
    
    # Validation check for existing file
    if (Test-Path $TSV_PATH) {
        $fileSize = (Get-Item $TSV_PATH).Length
        $firstLine = Get-Content $TSV_PATH -TotalCount 1
        
        if ($fileSize -gt 100MB -and $firstLine -notmatch "<!DOCTYPE html>") {
            $success = $true
            Write-Host "[*] Verified dataset found ($($fileSize / 1GB) GB). Skipping download." -ForegroundColor Green
            continue
        } else {
            Write-Host "[!] Found invalid/corrupted file. Purging and retrying..." -ForegroundColor Yellow
            Remove-Item $TSV_PATH -Force
        }
    }

    Write-Host "[+] Attempt $($attempts) of $($maxAttempts): Downloading 1.7GB dataset..." -ForegroundColor Cyan
    try {
        Set-Location "$PSScriptRoot/backend"
        Write-Host "    [Step 1] Synchronizing download tools..." -ForegroundColor Gray
        uv pip install gdown --quiet
        
        Write-Host "    [Step 2] Establishing secure stream to Google Drive..." -ForegroundColor Gray
        # Use gdown with specific large-file bypass flags
        uv run gdown "1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd" -o "$TSV_PATH" --fuzzy --confirm
        Set-Location "$PSScriptRoot"
        
        # Immediate validation
        if (Test-Path $TSV_PATH) {
            $firstLine = Get-Content $TSV_PATH -TotalCount 1
            if ($firstLine -match "<!DOCTYPE html>") {
                Write-Host "[!] ERROR: Bypass failed. Google Drive blocked the connection." -ForegroundColor Red
            } else {
                $success = $true
                Write-Host "[SUCCESS] Download verified." -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "[!] System Error during download: $_" -ForegroundColor Red
        Set-Location "$PSScriptRoot" # Ensure we reset path even on fail
    }
}

if (!$success) {
    Write-Host "`n[FATAL] Could not establish a clean download after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Please check your internet connection or manually download from:"
    Write-Host "https://drive.google.com/uc?id=1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd&export=download"
    exit 1
}

# 4. Build Index
Write-Host "[+] Initializing Local Neural Index (SQLITE)..." -ForegroundColor Yellow
Write-Host "    This processes 1.7GB of genomics data. Please wait." -ForegroundColor Gray

if (Test-Path "backend") {
    # Run the force_index script
    cd backend
    uv run python scratch/force_index.py
    cd ..
} else {
    Write-Host "[!] ERROR: Could not find backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "`n[SUCCESS] Local dataset is ready for high-speed diagnostic searches." -ForegroundColor Green
Write-Host "[*] You can now use the 'Local Vault' search in the Pipeline Engine." -ForegroundColor Cyan
