# Healynx Dataset Installation Script
# This script handles the download and indexing of the 1.7GB COSMIC dataset.

$DATA_DIR = "backend/data/cosmic"
$TSV_PATH = "$DATA_DIR/cmc_export.tsv"
# GOOGLE DRIVE ID: 1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd (1.7GB COSMIC TSV)

Write-Host "--- HEALYNX DATASET PROVISIONER ---" -ForegroundColor Cyan

# 1. Ensure directory exists
if (!(Test-Path $DATA_DIR)) {
    Write-Host "[+] Creating data directory: $DATA_DIR"
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
}

# 2. Check for existing dataset and validate size
if (Test-Path $TSV_PATH) {
    $fileSize = (Get-Item $TSV_PATH).Length
    if ($fileSize -lt 100MB) {
        Write-Host "[!] Detected corrupted or incomplete dataset file ($($fileSize / 1KB) KB). Cleaning up..." -ForegroundColor Yellow
        Remove-Item $TSV_PATH -Force
    }
}

if (!(Test-Path $TSV_PATH)) {
    Write-Host "[+] Downloading 1.7GB dataset via gdown. This will take significant time..." -ForegroundColor Yellow
    try {
        cd backend
        # Ensure gdown is installed first
        uv pip install gdown
        # Download using the direct ID which gdown handles correctly for large files
        uv run gdown "1e0fhTNt3yGOmYSZGsJpAbpDvb6zySyEd" -o "data/cosmic/cmc_export.tsv" --fuzzy
        cd ..
        
        if (!(Test-Path $TSV_PATH)) {
            Write-Host "[!] ERROR: Download finished but file not found. Check network connection." -ForegroundColor Red
            exit 1
        }
        Write-Host "[+] Download complete." -ForegroundColor Green
    } catch {
        Write-Host "[!] Download failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[*] Valid dataset found. Skipping download." -ForegroundColor Gray
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
