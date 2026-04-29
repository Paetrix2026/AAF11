#!/usr/bin/env bash
# Healynx — One-command dev environment setup (Mac / Linux)
#
# Run this ONCE after cloning the repo:
#   chmod +x setup.sh && ./setup.sh
#
# What this does:
#   1. Creates backend/.venv (Python virtual environment)
#   2. Installs all Python dependencies
#   3. Installs Node.js dependencies
#   4. Adds auto-activation to your shell profile (~/.zshrc or ~/.bashrc)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$PROJECT_ROOT/backend/.venv"
ACTIVATE="$VENV_PATH/bin/activate"

# Detect shell config file
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.bashrc"
fi

echo ""
echo "  ██╗  ██╗███████╗ █████╗ ██╗  ██╗   ██╗███╗  ██╗██╗  ██╗"
echo "  ██║  ██║██╔════╝██╔══██╗██║  ╚██╗ ██╔╝████╗ ██║╚██╗██╔╝"
echo "  ███████║█████╗  ███████║██║   ╚████╔╝ ██╔██╗██║ ╚███╔╝ "
echo "  ██╔══██║██╔══╝  ██╔══██║██║    ╚██╔╝  ██║╚████║ ██╔██╗ "
echo "  ██║  ██║███████╗██║  ██║███████╗██║   ██║ ╚███║██╔╝╚██╗"
echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚══╝╚═╝  ╚═╝"
echo "  Dev Environment Setup (Mac/Linux)"
echo ""

# ── Step 1: Python check ──────────────────────────────────────────────────────
echo "[1/4] Checking Python..."
if command -v python3 &>/dev/null; then
    echo "      Found: $(python3 --version)"
    PYTHON=python3
elif command -v python &>/dev/null; then
    echo "      Found: $(python --version)"
    PYTHON=python
else
    echo "      ERROR: Python not found."
    echo "      Install Python 3.11+ from https://python.org"
    exit 1
fi

# ── Step 2: Create venv ───────────────────────────────────────────────────────
echo "[2/4] Setting up Python virtual environment..."
if [ -d "$VENV_PATH" ]; then
    echo "      .venv already exists — skipping creation."
else
    $PYTHON -m venv "$VENV_PATH"
    echo "      Created: $VENV_PATH"
fi

# Activate for this session
source "$ACTIVATE"

# Upgrade pip and install
pip install --upgrade pip --quiet
echo "      Installing Python packages (this may take a few minutes)..."
pip install -r "$PROJECT_ROOT/backend/requirements.txt" --quiet
echo "      Python packages installed."

# ── Step 3: Node.js dependencies ─────────────────────────────────────────────
echo "[3/4] Installing Node.js dependencies..."
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    echo "      node_modules already exists — skipping."
else
    cd "$PROJECT_ROOT"
    npm install --silent
    echo "      Node packages installed."
fi

# ── Step 4: Shell profile auto-activation ────────────────────────────────────
echo "[4/4] Configuring shell auto-activation ($SHELL_RC)..."

MARKER="# Auto-activate Python venv for projects with backend/.venv"

if grep -qF "$MARKER" "$SHELL_RC" 2>/dev/null; then
    echo "      Already configured — skipping."
else
    cat >> "$SHELL_RC" << 'SNIPPET'

# ===========================================================
# Auto-activate Python venv for projects with backend/.venv
# (added by Healynx setup.sh — works for any project path)
# ===========================================================
_auto_venv() {
    local venv="$(pwd)/backend/.venv/bin/activate"
    if [ -f "$venv" ]; then
        source "$venv"
        echo "  [venv] $(basename $(pwd))"
    fi
}
# Hook into cd
cd() { builtin cd "$@" && _auto_venv; }
# Check on shell startup
_auto_venv
# ===========================================================
SNIPPET
    echo "      Profile updated: $SHELL_RC"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "  ================================================"
echo "   Setup complete!"
echo "  ================================================"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Fill in your secrets:"
echo "       .env.local           <- DATABASE_URL, NEXT_PUBLIC_API_URL"
echo "       backend/.env         <- DATABASE_URL, GROQ_API_KEY"
echo ""
echo "  2. Push schema to Neon (first time only):"
echo "       npm run db:push"
echo ""
echo "  3. Seed demo data (first time only):"
echo "       cd backend && python db/seed.py"
echo ""
echo "  4. Start the backend:"
echo "       cd backend && uvicorn main:app --reload --port 8000"
echo ""
echo "  5. Start the frontend (new terminal):"
echo "       npm run dev"
echo ""
echo "  Reload your shell to enable auto-activation:"
echo "       source $SHELL_RC"
echo ""
