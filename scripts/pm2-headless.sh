#!/usr/bin/env bash
# Start the bot with PM2 on headless servers (no GPU/display).
# Starts a virtual framebuffer (Xvfb) for WebGL software rendering.
#
# Prerequisites:
#   sudo apt install xvfb mesa-utils libgl1-mesa-dri
#
# Usage:
#   chmod +x ./scripts/pm2-headless.sh
#   ./scripts/pm2-headless.sh

set -e

export LIBGL_ALWAYS_SOFTWARE=1
export MESA_LOADER_DRIVER_OVERRIDE=llvmpipe
export DISPLAY=:99

# Start Xvfb if not already running
if ! pgrep -x Xvfb > /dev/null; then
  echo "Starting Xvfb on display :99..."
  Xvfb :99 -screen 0 1024x768x24 +extension GLX +render -noreset &
  sleep 1
fi

echo "Starting PM2 with software rendering..."
pm2 start ecosystem.config.cjs
pm2 logs
