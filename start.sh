#!/bin/bash

# Go to app directory
cd "$(dirname "$0")"

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start the application
echo "Starting Invoice App on port $PORT..."
node src/index.js