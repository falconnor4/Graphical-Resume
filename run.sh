#!/bin/bash

# Resume Site Runner Script
echo "🚀 Building and running your resume site..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Please install it:"
    echo "   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# Build the WebAssembly module
echo "🔧 Building WebAssembly module..."
if ! wasm-pack build --target web; then
    echo "❌ Build failed!"
    exit 1
fi

# Copy built files to www directory
echo "📦 Copying files to www directory..."
cp -r pkg/* www/pkg/

# Find an available port
PORT=8000
while lsof -i:$PORT >/dev/null 2>&1; do
    ((PORT++))
done

echo "🌐 Starting development server on port $PORT..."

# Try different server options
if command -v python3 &> /dev/null; then
    echo "   Using Python 3 server"
    cd www
    echo "✨ Resume site running at: http://localhost:$PORT"
    echo "   Press Ctrl+C to stop"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "   Using Python 2 server"
    cd www
    echo "✨ Resume site running at: http://localhost:$PORT"
    echo "   Press Ctrl+C to stop"
    python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
    echo "   Using Node.js server"
    echo "✨ Resume site running at: http://localhost:$PORT"
    echo "   Press Ctrl+C to stop"
    npx http-server www -p $PORT -c-1
elif command -v php &> /dev/null; then
    echo "   Using PHP server"
    cd www
    echo "✨ Resume site running at: http://localhost:$PORT"
    echo "   Press Ctrl+C to stop"
    php -S localhost:$PORT
else
    echo "❌ No suitable web server found!"
    echo "   Please install one of: python3, python, node.js, or php"
    echo "   Or manually serve the www/ directory"
    exit 1
fi