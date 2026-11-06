#!/usr/bin/env bash
# exit on error
set -o errexit

# Frontend is pre-built locally and committed to git (frontend/dist/).
# Render only needs to install Python dependencies.

echo "===> Upgrading pip..."
pip install --upgrade pip

echo "===> Installing CPU-only PyTorch to optimise memory and build size..."
pip install --no-cache-dir "torch>=2.2.0" --index-url https://download.pytorch.org/whl/cpu

echo "===> Installing remaining Python dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "===> Verifying frontend dist exists..."
if [ -d "frontend/dist" ]; then
  echo "===> frontend/dist found — $(ls frontend/dist | wc -l) files"
else
  echo "ERROR: frontend/dist not found! Run 'cd frontend && npm run build' locally and commit the dist folder."
  exit 1
fi

echo "===> Build completed successfully!"
