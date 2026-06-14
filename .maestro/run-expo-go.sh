#!/bin/bash
# Run Maestro tests on Expo Go (Android/iOS)
# Usage: .maestro/run-expo-go.sh
#
# Prerequisites:
#   1. Expo Go installed on device/simulator
#   2. Device/simulator connected and accessible via adb/simctl
#
# This script:
#   1. Starts the Expo dev server
#   2. Opens Expo Go on the connected device
#   3. Runs Maestro tests
#   4. Cleans up on exit

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cleanup() {
  echo ""
  echo "Stopping Expo dev server..."
  kill $EXPO_PID 2>/dev/null || true
}
trap cleanup EXIT

# Start Expo dev server
echo "Starting Expo dev server..."
cd "$PROJECT_DIR"
npx expo start --port 8081 &
EXPO_PID=$!

# Wait for dev server to be ready
echo "Waiting for dev server..."
sleep 5

# Run Maestro tests
echo "Running Maestro tests on Expo Go..."
maestro test "$SCRIPT_DIR/scripts-browse-preview-save.yaml"

echo ""
echo "Tests completed!"
