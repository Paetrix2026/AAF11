# Healynx Dataset Installation Script
# This script handles the download and indexing of the 1.7GB COSMIC dataset.

$DATA_DIR = "backend/data/cosmic"
$TSV_PATH = "$DATA_DIR/cmc_export.tsv"
# PLACEHOLDER: Replace with the actual S3/Drive link provided in the group chat
$DOWNLOAD_URL = "REPLACE_WITH_DIRECT_LINK" 

Write-Host "--- HEALYNX DATASET PROVISIONER ---" -ForegroundColor Cyan

# 1. Ensure directory exists
if (!(Test-Path $DATA_DIR)) {
    Write-Host "[+] Creating data directory: $DATA_DIR"
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
}

# 2. Check for existing dataset
if (!(Test-Path $TSV_PATH)) {
    if ($DOWNLOAD_URL -eq "REPLACE_WITH_DIRECT_LINK") {
        Write-Host "[!] ERROR: Download URL not configured." -ForegroundColor Red
        Write-Host "Please edit this script and set `$DOWNLOAD_URL` to the 1.7GB TSV link."
        Write-Host "Alternatively, manually place 'cmc_export.tsv' in $DATA_DIR"
        exit 1
    }

    Write-Host "[+] Downloading 1.7GB dataset. This will take significant time..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TSV_PATH -ShowProgress
        Write-Host "[+] Download complete." -ForegroundColor Green
    } catch {
        Write-Host "[!] Download failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[*] Dataset TSV already exists. Skipping download." -ForegroundColor Gray
}

# 3. Build Index
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
