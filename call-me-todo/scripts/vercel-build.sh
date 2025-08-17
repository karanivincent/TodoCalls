#!/bin/bash

echo "Starting Vercel build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Installing dependencies..."
npm install

echo "Checking for vite..."
if ! npx vite --version; then
  echo "Vite not found, installing directly..."
  npm install vite
fi

echo "Running build..."
npm run build

echo "Build complete!"