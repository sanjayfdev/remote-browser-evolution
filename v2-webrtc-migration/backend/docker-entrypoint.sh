#!/bin/bash
set -e

echo "🖥️ Starting Xvfb on DISPLAY=:99"
Xvfb :99 -screen 0 1024x576x24 +extension RANDR &

# Give Xvfb a moment
sleep 1

# Validate display (optional but useful)
# if ! xdpyinfo -display :99 >/dev/null 2>&1; then
#   echo "❌ Xvfb failed to start"
#   exit 1
# fi

echo "✅ Xvfb ready"

echo "🚀 Starting Node.js server"
exec node src/server.js
