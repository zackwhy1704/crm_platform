#!/bin/bash
# Quick local dev startup — runs backend stack in Docker + frontend in dev mode.
#
# Usage:
#   ./run_local.sh              — starts everything
#   ./run_local.sh frontend     — only Next.js
#   ./run_local.sh backend      — only Docker stack

set -e

MODE=${1:-all}

if [ "$MODE" = "backend" ] || [ "$MODE" = "all" ]; then
  echo "▶ Starting backend stack (Docker)..."
  docker compose up -d
  echo "  Backend: http://localhost:8000/health"
fi

if [ "$MODE" = "frontend" ] || [ "$MODE" = "all" ]; then
  echo "▶ Starting frontend (Next.js)..."
  cd frontend
  if [ ! -d node_modules ]; then
    echo "  Installing deps..."
    npm install
  fi
  npm run dev
fi
