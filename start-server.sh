#!/bin/bash

echo "Starting server management script..."

# Kill any existing Node.js processes
echo "Stopping any existing Node.js servers..."
pkill -f "node server.js" || true

# Wait for port to be released
echo "Checking if port 5000 is in use..."
while lsof -i :5000 >/dev/null 2>&1; do
    echo "Waiting for port 5000 to be released..."
    sleep 1
done

# Force close port if still in use
if lsof -i :5000 >/dev/null 2>&1; then
    echo "Force closing port 5000..."
    kill -9 $(lsof -t -i:5000) 2>/dev/null || true
fi

# Install node-cache if not already installed
echo "Checking for node-cache..."
if ! npm list | grep -q node-cache; then
    echo "Installing node-cache..."
    npm install node-cache
fi

# Start server with increased memory limits and garbage collection
echo "Starting server with optimized settings..."
NODE_OPTIONS="--max-old-space-size=2048 --expose-gc" node server.js 