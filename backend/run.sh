#!/usr/bin/env bash
# Start Aura backend
set -euo pipefail
cd "$(dirname "$0")"
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
