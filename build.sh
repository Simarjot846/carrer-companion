#!/usr/bin/env bash
# exit on error
set -o errexit

# ── Python / Backend ──────────────────────────────────────────────────────────
echo "===> Upgrading pip..."
pip install --upgrade pip

echo "===> Installing CPU-only PyTorch to optimise memory and build size..."
pip install --no-cache-dir "torch>=2.2.0" --index-url https://download.pytorch.org/whl/cpu

echo "===> Installing remaining Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# ── Node.js / Frontend ────────────────────────────────────────────────────────
echo "===> Checking Node.js availability..."
if ! command -v node &> /dev/null; then
  echo "===> Node.js not found. Installing via nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

echo "===> Node version: $(node --version)"
echo "===> npm version:  $(npm --version)"

echo "===> Installing frontend dependencies..."
cd frontend
npm ci

echo "===> Building React frontend (Vite)..."
npm run build

echo "===> Frontend built successfully. Contents of dist/:"
ls -la dist/
cd ..

echo "===> Build completed successfully!"
