"""
API Key Manager – manages multiple Gemini API keys with automatic rotation.

Priority:
1. .env GEMINI_API_KEY (always tried first if present)
2. UI-added keys from the database (rotated on failure)

When a key fails (auth error, quota exhausted), the manager marks it
inactive and rotates to the next available key automatically.
"""
import logging
import threading
from datetime import datetime

from flask import current_app

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_current_key: str | None = None  # currently active key


def _get_env_key() -> str:
    """Return the API key from .env / Flask config (may be empty)."""
    return (current_app.config.get("GEMINI_API_KEY") or "").strip()


def _get_db_keys(only_active: bool = True) -> list:
    """Return API key records from the database."""
    from app.models.api_key import ApiKey
    q = ApiKey.query
    if only_active:
        q = q.filter_by(is_active=True)
    return q.order_by(ApiKey.created_at.asc()).all()


def get_all_keys() -> list[dict]:
    """Return all keys (for the management UI), including the .env key."""
    from app.models.api_key import ApiKey
    result = []
    env_key = _get_env_key()
    if env_key:
        masked = env_key[:8] + "..." + env_key[-4:] if len(env_key) > 12 else "***"
        result.append({
            "id": None,
            "key_masked": masked,
            "label": ".env (mặc định)",
            "is_active": True,
            "source": "env",
            "last_error": None,
            "last_used_at": None,
            "created_at": None,
        })
    db_keys = ApiKey.query.order_by(ApiKey.created_at.asc()).all()
    for k in db_keys:
        d = k.to_dict()
        d["source"] = "ui"
        result.append(d)
    return result


def get_current_api_key() -> str:
    """
    Return the current best API key to use.
    - If _current_key is set and valid, use it.
    - Otherwise, pick the first available key (env first, then DB).
    Raises ValueError if no key is available.
    """
    global _current_key
    with _lock:
        if _current_key:
            return _current_key
        key = _pick_next_key()
        _current_key = key
        return key


def _pick_next_key(exclude: str | None = None) -> str:
    """Pick the next available key, excluding the given one."""
    env_key = _get_env_key()
    if env_key and env_key != exclude:
        return env_key

    db_keys = _get_db_keys(only_active=True)
    for k in db_keys:
        if k.key != exclude:
            return k.key

    raise ValueError("Không có API key khả dụng. Vui lòng thêm key Gemini trong cài đặt hoặc .env")


def rotate_key(failed_key: str, error_msg: str) -> str:
    """
    Mark the failed key as problematic and rotate to the next one.
    Returns the new key, raises ValueError if none left.
    """
    global _current_key
    from app.models import db
    from app.models.api_key import ApiKey

    logger.warning("Rotating away from key %s...%s: %s", failed_key[:8], failed_key[-4:], error_msg)

    with _lock:
        # Mark DB key as inactive if it's a DB key
        db_key = ApiKey.query.filter_by(key=failed_key).first()
        if db_key:
            db_key.is_active = False
            db_key.last_error = error_msg[:500]
            db.session.commit()

        try:
            new_key = _pick_next_key(exclude=failed_key)
        except ValueError:
            _current_key = None
            raise

        _current_key = new_key
        return new_key


def mark_key_used(key: str):
    """Update last_used_at for a DB key."""
    from app.models import db
    from app.models.api_key import ApiKey

    db_key = ApiKey.query.filter_by(key=key).first()
    if db_key:
        db_key.last_used_at = datetime.utcnow()
        db.session.commit()


def add_key(key: str, label: str | None = None) -> dict:
    """Add a new API key from the UI."""
    from app.models import db
    from app.models.api_key import ApiKey

    key = key.strip()
    if not key:
        raise ValueError("API key không được để trống")

    existing = ApiKey.query.filter_by(key=key).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.last_error = None
            existing.label = label or existing.label
            db.session.commit()
            return existing.to_dict()
        raise ValueError("API key này đã tồn tại")

    api_key = ApiKey(key=key, label=label, is_active=True)
    db.session.add(api_key)
    db.session.commit()
    d = api_key.to_dict()
    d["source"] = "ui"
    return d


def remove_key(key_id: int) -> bool:
    """Remove an API key by id."""
    global _current_key
    from app.models import db
    from app.models.api_key import ApiKey

    api_key = ApiKey.query.get(key_id)
    if not api_key:
        return False

    with _lock:
        if _current_key == api_key.key:
            _current_key = None

    db.session.delete(api_key)
    db.session.commit()
    return True


def toggle_key(key_id: int, active: bool) -> dict | None:
    """Enable/disable an API key."""
    global _current_key
    from app.models import db
    from app.models.api_key import ApiKey

    api_key = ApiKey.query.get(key_id)
    if not api_key:
        return None

    api_key.is_active = active
    if active:
        api_key.last_error = None
    else:
        with _lock:
            if _current_key == api_key.key:
                _current_key = None
    db.session.commit()
    d = api_key.to_dict()
    d["source"] = "ui"
    return d


def reset_current():
    """Force re-selection on next call (used after key changes)."""
    global _current_key
    with _lock:
        _current_key = None


def validate_key_quick(key: str) -> dict:
    """Quick validation of a specific key by calling list_models."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        list(genai.list_models())
        return {"valid": True, "error": None}
    except Exception as e:
        err_str = str(e).lower()
        if any(kw in err_str for kw in ("401", "403", "invalid api key", "api_key_invalid",
                                         "permission_denied", "api key not valid")):
            return {"valid": False, "error": "API key không hợp lệ"}
        if "429" in err_str or "quota" in err_str:
            return {"valid": True, "error": "Key hợp lệ nhưng đã hết quota"}
        return {"valid": False, "error": f"Lỗi kiểm tra: {str(e)[:100]}"}
