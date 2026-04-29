# Healynx Dataset Installation Script
# This script handles the download and indexing of the 1.7GB COSMIC dataset.

$DATA_DIR = "backend/data/cosmic"
$TSV_PATH = "$DATA_DIR/cmc_export.tsv"
# PLACEHOLDER: Replace with the actual S3/Drive link provided in the group chat
# GOOGLE DRIVE ID: 1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd (1.7GB COSMIC TSV)
$DOWNLOAD_URL = "https://drive.google.com/uc?id=1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd&export=download" 

Write-Host "--- HEALYNX DATASET PROVISIONER ---" -ForegroundColor Cyan

# 1. Ensure directory exists
if (!(Test-Path $DATA_DIR)) {
    Write-Host "[+] Creating data directory: $DATA_DIR"
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
}

# 2. Check for existing dataset
if (!(Test-Path $TSV_PATH)) {
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
