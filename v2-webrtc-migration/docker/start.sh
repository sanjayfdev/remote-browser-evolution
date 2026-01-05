#!/bin/bash

echo "🖥️ Starting virtual display..."
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

sleep 2

echo "🚀 Starting Node backend..."
cd backend
npm install
node server.js
