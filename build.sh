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
echo "===> Installing Node.js dependencies for frontend..."
cd frontend
npm ci

echo "===> Building React frontend (Vite)..."
npm run build
cd ..

echo "===> Build completed successfully!"
