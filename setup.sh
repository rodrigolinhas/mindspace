#!/bin/bash

echo "=========================================="
echo "      MindSpace Setup (Linux/macOS)"
echo "=========================================="

echo "[1/3] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi
echo "Node.js is installed."

echo "[2/3] Verifying and installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error during installation."
    exit 1
fi

echo "[3/3] Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error during build."
    exit 1
fi

echo "=========================================="
echo "      Setup Complete! "
echo "=========================================="
echo "You can now run the project with:"
echo "   npm run dev    (Development)"
echo "   npm start      (Production)"
echo "=========================================="
