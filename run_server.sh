#!/bin/bash

# Kill any existing Node.js server processes
echo "Checking for existing Node.js server processes..."
pkill -f "node server.js" || echo "No Node.js processes found"

# Wait to ensure the port is released
echo "Waiting for port 5000 to be released..."
sleep 2

# Check if port 5000 is still in use
PORT_IN_USE=$(lsof -i :5000 | grep LISTEN)
if [ -n "$PORT_IN_USE" ]; then
    echo "Port 5000 is still in use. Trying to force close..."
    lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
    sleep 1
fi

# Start the server with more memory available
echo "Starting server with increased memory limits..."
# Use --max-old-space-size to increase memory limit to 2GB
node --max-old-space-size=2048 server.js 