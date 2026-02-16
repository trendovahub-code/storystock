#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_LOG="/tmp/trendova_backend.log"
FRONTEND_LOG="/tmp/trendova_frontend.log"
REDIS_LOG="/tmp/trendova_redis.log"

BACKEND_PID=""
FRONTEND_PID=""
REDIS_PID=""

cleanup() {
  echo ""
  echo "Stopping Trendova Hub..."
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${REDIS_PID}" ]] && kill -0 "${REDIS_PID}" 2>/dev/null; then
    kill "${REDIS_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting Trendova Hub..."

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Backend directory not found: $BACKEND_DIR"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

if [[ ! -d "$BACKEND_DIR/venv" ]]; then
  echo "Creating backend virtual environment..."
  (cd "$BACKEND_DIR" && python -m venv venv)
fi

echo "Ensuring backend dependencies..."
REQ_FILE=""
if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
  REQ_FILE="$BACKEND_DIR/requirements.txt"
elif [[ -f "$BACKEND_DIR/requirements-dev.txt" ]]; then
  REQ_FILE="$BACKEND_DIR/requirements-dev.txt"
fi

if [[ -n "$REQ_FILE" ]]; then
  ("$BACKEND_DIR/venv/bin/pip" install -r "$REQ_FILE" >/dev/null)
else
  echo "No requirements file found. Skipping backend dependency install."
fi

if command -v redis-server >/dev/null 2>&1; then
  if ! lsof -i :6379 >/dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server >"$REDIS_LOG" 2>&1 &
    REDIS_PID=$!
  else
    echo "Redis already running on port 6379."
  fi
else
  echo "Redis not found. Skipping Redis startup."
fi

echo "Starting backend..."
cd "$BACKEND_DIR"
PORT=5002 FLASK_ENV=development "$BACKEND_DIR/venv/bin/python" app.py >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR"

echo "Ensuring frontend dependencies..."
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "Starting frontend..."
cd "$FRONTEND_DIR"
npm run dev >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

echo ""
echo "Trendova Hub is starting up."
echo "Backend log: $BACKEND_LOG"
echo "Frontend log: $FRONTEND_LOG"
if [[ -n "${REDIS_PID}" ]]; then
  echo "Redis log: $REDIS_LOG"
fi
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop all services."

wait
