#!/bin/bash
# Run Maestro tests on Web (Chromium)
# Usage: .maestro/run-web.sh
#
# Prerequisites:
#   1. Maestro CLI installed (maestro --version)
#   2. Chromium will be auto-downloaded on first run
#
# This script:
#   1. Starts the Expo dev server in web mode
#   2. Runs Maestro tests against localhost:8081
#   3. Cleans up on exit

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cleanup() {
  echo ""
  echo "Stopping Expo dev server..."
  kill $EXPO_PID 2>/dev/null || true
}
trap cleanup EXIT

# Start Expo dev server in web mode
echo "Starting Expo web dev server..."
cd "$PROJECT_DIR"
npx expo start --web --port 8081 &
EXPO_PID=$!

# Wait for web server to be ready
echo "Waiting for web server..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "Web server ready!"
    break
  fi
  sleep 1
done

# Run Maestro tests on web
echo "Running Maestro tests on Web..."
maestro test --headless "$SCRIPT_DIR/scripts-browse-web.yaml"

echo ""
echo "Tests completed!"
