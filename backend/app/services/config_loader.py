"""Load and resolve config from YAML."""
import shutil
from pathlib import Path

import yaml

# Avoid circular import - compute paths here
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = _BACKEND_DIR.parent
CONFIG_DIR = PROJECT_ROOT / "_config"
CONFIG_FILE = CONFIG_DIR / "config.yaml"
CONFIG_EXAMPLE = CONFIG_DIR / "config.yaml.example"


def load_config():
    """Load config from YAML. Use example if main config does not exist."""
    config_path = CONFIG_FILE if CONFIG_FILE.exists() else CONFIG_EXAMPLE
    if not config_path.exists():
        return _default_config()

    with open(config_path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}

    return _resolve_paths(cfg)


def _default_config():
    """Default config when no YAML exists."""
    return {
        "project_root": str(PROJECT_ROOT),
        "database_path": str(Path(PROJECT_ROOT) / "data" / "database"),
        "documents_path": str(Path(PROJECT_ROOT) / "data" / "documents"),
        "output_folder": str(Path(PROJECT_ROOT) / "data" / "output"),
        "analysis_output": str(Path(PROJECT_ROOT) / "data" / "output" / "analysis"),
    }


def _resolve_paths(cfg):
    """Resolve {project-root} placeholders in paths."""
    root = Path(cfg.get("project_root", "."))
    if not root.is_absolute():
        root = Path(PROJECT_ROOT) / root

    resolved = dict(cfg)
    resolved["project_root"] = str(root)

    path_keys = ("database_path", "documents_path", "output_folder", "analysis_output")
    for key in path_keys:
        val = cfg.get(key, "")
        if isinstance(val, str) and val:
            val = val.replace("{project-root}", str(root))
            if not Path(val).is_absolute():
                val = str(root / val)
            resolved[key] = val

    return resolved


def ensure_data_dirs(config):
    """Create data directories if they do not exist."""
    for key in ("database_path", "documents_path", "analysis_output"):
        path = config.get(key)
        if path:
            Path(path).mkdir(parents=True, exist_ok=True)


def bootstrap_config():
    """Copy config.yaml.example to config.yaml if config.yaml does not exist."""
    if not CONFIG_FILE.exists() and CONFIG_EXAMPLE.exists():
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(CONFIG_EXAMPLE, CONFIG_FILE)


_config_cache = None


def get_config():
    """Get resolved config (cached)."""
    global _config_cache
    if _config_cache is None:
        _config_cache = load_config()
        ensure_data_dirs(_config_cache)
    return _config_cache
