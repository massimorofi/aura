#!/usr/bin/env bash
# Start Aura (backend + frontend)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$SCRIPT_DIR/.aura_pids"

# Create .env if missing
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
fi

# Install backend deps if needed
if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
    echo "==> Creating Python virtual environment..."
    python3 -m venv "$SCRIPT_DIR/backend/.venv"
fi
source "$SCRIPT_DIR/backend/.venv/bin/activate"
pip install -r "$SCRIPT_DIR/backend/requirements.txt" --quiet

# Install frontend deps if needed
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "==> Installing frontend dependencies..."
    (cd "$SCRIPT_DIR/frontend" && npm install)
fi

# Kill any leftover processes
if [ -f "$PIDFILE" ]; then
    echo "==> Cleaning up previous session..."
    while read -r pid; do
        kill -- "-${pid}" 2>/dev/null || true
        kill "$pid" 2>/dev/null || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
fi

# Start backend (no subshell — uvicorn IS the background process)
echo "==> Starting backend on :3002..."
(
    source "$SCRIPT_DIR/backend/.venv/bin/activate"
    cd "$SCRIPT_DIR/backend"
    exec uvicorn app.main:app --host 0.0.0.0 --port 3002
) &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PIDFILE"

# Start frontend (no subshell — npm IS the background process)
echo "==> Starting frontend on :3000..."
(
    cd "$SCRIPT_DIR/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PIDFILE"

echo ""
echo "Aura is running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3002"
echo "  PIDs:     $BACKEND_PID, $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop"

trap 'echo; echo "==> Stopping..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f "$PIDFILE"; exit' INT TERM
wait
