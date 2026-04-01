#!/usr/bin/env bash
set -e

# Ensure we are running from the third_party directory
if [ "$(basename "$PWD")" != "third_party" ]; then
    echo "Error: Please run this script from the third_party directory."
    exit 1
fi

git clone git@github.com:GeoRAMIEL/co-tracker.git
cd co-tracker

# make sure we are using the venv in the root of the project
echo "This script installs python dependencies for CoTracker. Make sure you have activated the virtual environment in the root of the project before running this script."
read -p "Press enter to continue or Ctrl+C to cancel..."
pip install -e .
pip install matplotlib flow_vis tqdm tensorboard

mkdir -p checkpoints
cd checkpoints
# download the offline (single window) model
wget https://huggingface.co/facebook/cotracker3/resolve/main/scaled_offline.pth

