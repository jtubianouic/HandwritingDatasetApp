#!/bin/bash

# --- Configuration ---
SOURCE_DIR="D:/MIT/HandwritingDatasetApp/dist"
REMOTE_USER="james-rpi-5"
REMOTE_HOST="192.168.0.154"
DEST_PATH="/home/james-rpi-5/handwritten-automation/"

echo "Removing dist directory..." 

rm -f dist

echo "Creating new build for production..."
npm run build

# --- Execution ---
echo "Starting transfer of $SOURCE_DIR to $REMOTE_HOST..."

scp -r "$SOURCE_DIR" "${REMOTE_USER}@${REMOTE_HOST}:${DEST_PATH}"

# Check if the command succeeded
if [ $? -eq 0 ]; then
    echo "Transfer completed successfully."
else
    echo "Transfer failed. Please check your connection or paths."
fi