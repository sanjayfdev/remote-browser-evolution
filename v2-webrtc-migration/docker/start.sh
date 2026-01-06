#!/bin/bash
set -e

echo "🖥️ Starting virtual display..."
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

sleep 2

echo "🚀 Starting control server..."
cd /app/backend
npm install
node server.js
