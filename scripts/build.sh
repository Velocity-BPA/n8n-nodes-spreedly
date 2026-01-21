#!/bin/bash
set -e

echo "🏗️ Building n8n-nodes-spreedly..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Run build
echo "⚙️ Compiling TypeScript..."
npm run build

echo "✅ Build complete!"
