"""Application configuration."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Workspace root: parent of backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from project root
env_path = PROJECT_ROOT / ".env"
load_dotenv(env_path)

# Config paths
CONFIG_DIR = PROJECT_ROOT / "_config"
CONFIG_FILE = CONFIG_DIR / "config.yaml"
CONFIG_EXAMPLE = CONFIG_DIR / "config.yaml.example"


def _init_db_uri():
    try:
        from app.services.config_loader import get_config

        cfg = get_config()
        db_path = cfg.get("database_path", str(Path(PROJECT_ROOT) / "data" / "database"))
    except Exception:
        db_path = str(Path(PROJECT_ROOT) / "data" / "database")
    Path(db_path).mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{Path(db_path) / 'baws.db'}"


class Config:
    """Flask configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    PROJECT_ROOT = str(PROJECT_ROOT)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    SQLALCHEMY_DATABASE_URI = _init_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
