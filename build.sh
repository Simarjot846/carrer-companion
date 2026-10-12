#!/usr/bin/env bash
# exit on error
set -o errexit

echo "===> Upgrading pip..."
pip install --upgrade pip

echo "===> Installing CPU-only PyTorch to optimize memory and build size..."
pip install --no-cache-dir torch>=2.2.0 --index-url https://download.pytorch.org/whl/cpu

echo "===> Installing remaining dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "===> Build completed successfully!"
