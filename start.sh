#!/usr/bin/env bash
# BA Workspace - Simple startup script for non-technical users.
# Run from project root: ./start.sh

set -e
cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "=============================================="
echo "  BA Workspace - Preparing application..."
echo "=============================================="
echo ""

# --- Check required tools ---
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 is not installed. Please install Python 3 and run again."
  echo "   See: https://www.python.org/downloads/"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) and run again."
  echo "   See: https://nodejs.org/"
  exit 1
fi

echo "✓ Python 3 and Node.js are available."
echo ""

# --- Config file .env ---
if [ ! -f "$ROOT/.env" ]; then
  echo "📄 No .env file found. Creating from .env.example..."
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo ""
  echo "⚠️  You need to add your API key to .env for full functionality:"
  echo "   1. Open the file: .env (same folder as start.sh)"
  echo "   2. Optionally add any environment configuration"
  echo "   3. Get a free API key at: https://aistudio.google.com/app/apikey"
  echo ""
  read -p "Have you updated .env? (Press Enter to continue, Ctrl+C to exit and edit later): " _
  echo ""
fi

# --- Backend: venv and install ---
echo "📦 Installing Backend dependencies (Python)..."
if [ ! -d "$ROOT/backend/venv" ]; then
  python3 -m venv "$ROOT/backend/venv"
fi
# shellcheck source=/dev/null
source "$ROOT/backend/venv/bin/activate"
pip install -q -r "$ROOT/backend/requirements.txt"
echo "✓ Backend ready."
echo ""

# --- Frontend: install ---
echo "📦 Installing Frontend dependencies (Node)..."
(cd "$ROOT/frontend" && npm install --silent)
echo "✓ Frontend ready."
echo ""

# --- Run Backend in background ---
BE_PID=""
cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$BE_PID" ] && kill "$BE_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Backend (port 5050)..."
cd "$ROOT" && python3 backend/run.py &
BE_PID=$!
sleep 2
if ! kill -0 "$BE_PID" 2>/dev/null; then
  echo "❌ Backend failed to start. Check .env configuration and try again."
  exit 1
fi
echo "✓ Backend is running."
echo ""

# --- Run Frontend ---
echo "🚀 Starting web interface (port 3000)..."
echo ""
echo "=============================================="
echo "  Open your browser and go to:"
echo "  👉 http://localhost:3000"
echo "=============================================="
echo "  Press Ctrl+C to stop the application."
echo "=============================================="
echo ""

cd "$ROOT/frontend" && npm run dev
