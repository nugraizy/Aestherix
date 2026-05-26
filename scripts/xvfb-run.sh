#!/usr/bin/env bash
export LIBGL_ALWAYS_SOFTWARE=1
export MESA_LOADER_DRIVER_OVERRIDE=llvmpipe

if command -v xvfb-run &>/dev/null; then
  exec xvfb-run -a \
    -s "-screen 0 1024x768x24 +extension GLX +render -noreset" \
    node . nugraizy_android --watch --pair-mode --limit-reset --multi-cmd --cool-down
else
  echo "[WARN] xvfb-run not found. WebGL mesh gradients will use SVG fallback."
  echo "       Install with: sudo apt install xvfb"
  exec node . nugraizy_android --watch --pair-mode --limit-reset --multi-cmd --cool-down
fi
