@echo off
setlocal enabledelayedexpansion

REM Change to the directory where this script is located
cd /d "%~dp0"

echo.
echo ========================================
echo   Healynx - Starting Backend & Frontend
echo ========================================
echo.

REM Start backend with venv activated (independent window)
start "Healynx Backend (Port 8000)" cmd /k "cd backend && .venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

REM Start frontend (independent window) - don't wait
start "Healynx Frontend (Port 3000)" cmd /k "npm run dev"

echo.
echo ✓ Backend starting on   http://localhost:8000
echo ✓ Frontend starting on  http://localhost:3000
echo ✓ Services launched in separate windows
echo.
echo You can close this window. Backend and Frontend will continue running.
echo Close their respective windows to stop them.
echo.
