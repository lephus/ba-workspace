"""
Multi-key manager for Gemini API keys.

Priority:
  1. GEMINI_API_KEY from .env (always tried first)
  2. Active UI keys from the database (ordered by last_used_at ASC → least-recently-used first)

Provides:
  - get_current_api_key()   → best available key string
  - rotate_key(failed, msg) → mark failed & switch to next (raises ValueError if none left)
  - mark_key_used(key)      → update last_used_at in DB
  - get_current_key_info()  → {key_masked, source, id} of the active key (for UI)
"""
import logging
import threading
from datetime import datetime

from flask import current_app

logger = logging.getLogger(__name__)

_lock = threading.Lock()

# In-memory state: which key is currently "active"
_current_key: str | None = None
_failed_keys: set[str] = set()  # keys that failed in the current "round"


def _mask(key: str) -> str:
    if len(key) > 12:
        return key[:8] + "..." + key[-4:]
    return "***"


def _env_key() -> str | None:
    """Return the .env GEMINI_API_KEY if set and non-empty."""
    try:
        val = current_app.config.get("GEMINI_API_KEY", "").strip()
        return val or None
    except RuntimeError:
        import os
        val = os.getenv("GEMINI_API_KEY", "").strip()
        return val or None


def _db_keys() -> list[dict]:
    """Return active UI keys from the database, ordered LRU-first."""
    try:
        from app.models.api_key import ApiKey
        rows = (
            ApiKey.query
            .filter_by(is_active=True)
            .order_by(ApiKey.last_used_at.asc().nullsfirst())
            .all()
        )
        return [{"id": r.id, "key": r.key, "label": r.label} for r in rows]
    except Exception as e:
        logger.debug("Could not query DB keys: %s", e)
        return []


def _all_candidate_keys() -> list[dict]:
    """
    Build ordered list of candidate keys.
    Returns list of {"key": str, "source": "env"|"ui", "id": int|None, "label": str|None}
    """
    candidates = []
    env = _env_key()
    if env:
        candidates.append({"key": env, "source": "env", "id": None, "label": ".env"})
    for row in _db_keys():
        candidates.append({"key": row["key"], "source": "ui", "id": row["id"], "label": row.get("label")})
    return candidates


def get_current_api_key() -> str:
    """
    Return the best available API key.
    Raises ValueError if no valid key is available.
    """
    global _current_key

    with _lock:
        candidates = _all_candidate_keys()
        if not candidates:
            raise ValueError("Không có API key nào được cấu hình. Thêm key qua UI hoặc file .env")

        # If current key is still valid (not failed), keep using it
        if _current_key and _current_key not in _failed_keys:
            # Verify it's still in the candidate list (not deleted/disabled)
            if any(c["key"] == _current_key for c in candidates):
                return _current_key

        # Pick first non-failed candidate
        for c in candidates:
            if c["key"] not in _failed_keys:
                _current_key = c["key"]
                logger.info("Using key %s (source=%s)", _mask(c["key"]), c["source"])
                return _current_key

        # All keys failed — reset failures and try again with first key
        logger.warning("All %d keys failed, resetting failure state", len(candidates))
        _failed_keys.clear()
        _current_key = candidates[0]["key"]
        return _current_key


def rotate_key(failed_key: str, error_msg: str) -> str:
    """
    Mark *failed_key* as failed and rotate to the next available key.
    Also records the error on the DB row (if it's a UI key).
    Raises ValueError if no more keys are available.
    """
    global _current_key

    with _lock:
        _failed_keys.add(failed_key)
        logger.warning("Marked key %s as failed: %s", _mask(failed_key), error_msg[:120])

        # Record error on DB key
        _record_db_error(failed_key, error_msg)

        candidates = _all_candidate_keys()
        for c in candidates:
            if c["key"] not in _failed_keys:
                _current_key = c["key"]
                logger.info("Rotated to key %s (source=%s)", _mask(c["key"]), c["source"])
                return _current_key

        raise ValueError("Tất cả API key đều bị lỗi. Vui lòng kiểm tra hoặc thêm key mới.")


def mark_key_used(key: str) -> None:
    """Update last_used_at for a DB key after successful use."""
    try:
        from app.models.api_key import ApiKey
        from app.models import db
        row = ApiKey.query.filter_by(key=key).first()
        if row:
            row.last_used_at = datetime.utcnow()
            row.last_error = None  # clear previous error on success
            db.session.commit()
    except Exception as e:
        logger.debug("mark_key_used failed: %s", e)


def get_current_key_info() -> dict | None:
    """
    Return info about the currently active key for display in the UI.
    Returns {"key_masked": str, "source": "env"|"ui", "id": int|None, "label": str|None}
    or None if no key is configured.
    """
    with _lock:
        candidates = _all_candidate_keys()
        if not candidates:
            return None

        active = _current_key
        for c in candidates:
            if c["key"] == active:
                return {
                    "key_masked": _mask(c["key"]),
                    "source": c["source"],
                    "id": c["id"],
                    "label": c["label"],
                }

        # current_key not found in candidates (deleted?), return first
        c = candidates[0]
        return {
            "key_masked": _mask(c["key"]),
            "source": c["source"],
            "id": c["id"],
            "label": c["label"],
        }


def reset_failures() -> None:
    """Clear all failure state (useful after adding a new key)."""
    global _current_key
    with _lock:
        _failed_keys.clear()
        _current_key = None


def _record_db_error(key: str, error_msg: str) -> None:
    """Record an error message on the DB key row (must be called with _lock held)."""
    try:
        from app.models.api_key import ApiKey
        from app.models import db
        row = ApiKey.query.filter_by(key=key).first()
        if row:
            row.last_error = error_msg[:500]
            db.session.commit()
    except Exception as e:
        logger.debug("_record_db_error failed: %s", e)
