@echo off
SETLOCAL
echo --- HEALYNX DATASET PROVISIONER (BATCH WRAPPER) ---
echo Initializing PowerShell execution...

powershell -ExecutionPolicy Bypass -File "%~dp0dataset-install.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Done.
) else (
    echo.
    echo Installation failed.
)
pause
