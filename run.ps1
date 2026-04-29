# Healynx - Start Backend & Frontend in separate windows

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Healynx - Starting Backend & Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add Windows Defender exclusions (silent fail if not admin)
try {
    Add-MpPreference -ExclusionPath "$PSScriptRoot\backend\.venv" -ErrorAction SilentlyContinue
    Write-Host "[+] Windows Defender exclusions added" -ForegroundColor Green
} catch {
    Write-Host "[!] Run PowerShell as Admin to add Defender exclusions" -ForegroundColor Yellow
}

# Start Backend in new PowerShell window
$backendCmd = "cd '$PSScriptRoot\backend'; & .\.venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 127.0.0.1 --port 8000"
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", $backendCmd) -WindowStyle Normal | Out-Null

# Wait for backend to spin up
Start-Sleep -Seconds 3

# Start Frontend in new PowerShell window
$frontendCmd = "cd '$PSScriptRoot'; npm run dev"
Start-Process powershell.exe -ArgumentList @("-NoExit", "-Command", $frontendCmd) -WindowStyle Normal | Out-Null

Write-Host "[+] Backend starting on   http://localhost:8000" -ForegroundColor Green
Write-Host "[+] Frontend starting on  http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Services launched in separate windows." -ForegroundColor Yellow
Write-Host "Close their windows to stop them." -ForegroundColor Yellow
Write-Host ""
