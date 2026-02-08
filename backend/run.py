#!/usr/bin/env python3
"""Run the BAWS Flask backend server.

Must be run from the backend/ directory:
  cd backend && python3 run.py

Or from workspace root:
  python3 backend/run.py
"""
import os
import sys

# Resolve paths relative to this script
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Ensure backend is in path and cwd is project root
sys.path.insert(0, BACKEND_DIR)
os.chdir(PROJECT_ROOT)

# Bootstrap config on first run
from app.services.config_loader import bootstrap_config

bootstrap_config()

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("BE_PORT", "5000"))
    # use_reloader=False avoids "can't open file run.py" when reloader restarts from wrong cwd
    use_reloader = os.getenv("FLASK_RELOAD", "0").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=use_reloader)
