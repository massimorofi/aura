#!/usr/bin/env bash
# Stop Aura
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$SCRIPT_DIR/.aura_pids"

if [ ! -f "$PIDFILE" ]; then
    echo "No running Aura processes found (no PID file)."
    exit 0
fi

echo "==> Stopping Aura..."
while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && echo "  Stopped $pid" || true
    else
        echo "  Already stopped: $pid"
    fi
done < "$PIDFILE"
rm -f "$PIDFILE"
echo "Done."
