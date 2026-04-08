#!/usr/bin/env bash
# Download the LaMa (Large Mask Inpainting) TorchScript checkpoint.
# Run from the third_party/ directory.

set -euo pipefail

if [ "$(basename "$PWD")" != "third_party" ]; then
    echo "Error: Please run this script from the third_party directory."
    exit 1
fi

DEST_DIR="lama"
CKPT_PATH="$DEST_DIR/big-lama.pt"
URL="https://github.com/enesmsahin/simple-lama-inpainting/releases/download/v0.1.0/big-lama.pt"

mkdir -p "$DEST_DIR"

if [ -f "$CKPT_PATH" ]; then
    echo "LaMa checkpoint already exists at $CKPT_PATH, skipping download."
else
    echo "Downloading LaMa checkpoint (~206 MB)..."
    curl -L -o "$CKPT_PATH" "$URL"
    echo "LaMa checkpoint saved to $CKPT_PATH"
fi
