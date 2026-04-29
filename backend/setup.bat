@echo off
:: Healynx Backend — Virtual Environment Setup
:: Run this once from the backend\ directory

echo.
echo ============================================
echo  Healynx Backend — Setup
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+ first.
    exit /b 1
)

echo [1/3] Creating virtual environment at backend\.venv ...
python -m venv .venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    exit /b 1
)
echo        Done.

echo [2/3] Activating and upgrading pip ...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip --quiet
echo        Done.

echo [3/3] Installing requirements ...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install requirements.
    exit /b 1
)

echo.
echo ============================================
echo  Setup complete!
echo.
echo  To start the backend:
echo    1. Open terminal in C:\Projects\AAF11
echo       (venv activates automatically)
echo    2. cd backend
echo    3. uvicorn main:app --reload --port 8000
echo ============================================
echo.
