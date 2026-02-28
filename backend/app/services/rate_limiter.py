"""
In-memory rate-limit tracker for Gemini API calls.
Tracks requests-per-minute (RPM), requests-per-day (RPD),
429 errors, and recent API errors.
Also caches API key validation results.

Based on Google's rate-limit model:
- RPM  (Requests per Minute)
- TPM  (Tokens per Minute) — not tracked locally
- RPD  (Requests per Day) — resets at midnight Pacific Time
"""
import threading
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Union

_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Tier definitions based on Google Gemini API docs
# ---------------------------------------------------------------------------
TIER = "Free"  # "Free" | "Tier 1" | "Tier 2" | "Tier 3"
MODEL_ID = "gemini-2.5-flash"

# Per-tier defaults for gemini-2.5-flash (approximate)
_TIER_LIMITS: dict[str, dict] = {
    "Free":   {"rpm": 30,  "rpd": 1500,  "tpm": 1_000_000},
    "Tier 1": {"rpm": 2000, "rpd": 10_000, "tpm": 4_000_000},
    "Tier 2": {"rpm": 4000, "rpd": 15_000, "tpm": 4_000_000},
    "Tier 3": {"rpm": 4000, "rpd": 25_000, "tpm": 4_000_000},
}

_tier_cfg = _TIER_LIMITS.get(TIER, _TIER_LIMITS["Free"])
RPM_LIMIT: int = _tier_cfg["rpm"]
RPD_LIMIT: int = _tier_cfg["rpd"]
TPM_LIMIT: int = _tier_cfg["tpm"]  # informational only
WINDOW = 60  # seconds (RPM window)

# Pacific timezone for RPD reset (Google resets at midnight PT)
_PT = timezone(timedelta(hours=-8))

# Rolling timestamps of requests in current window (RPM)
_timestamps: list[float] = []

# Daily counter: {"date": "YYYY-MM-DD", "count": int}
_daily: dict = {"date": "", "count": 0}

# Last time we got a 429
_last_429: Optional[float] = None

# Recent API error info: {"type": "quota"|"auth"|"other", "message": str, "ts": float}
_last_error: Optional[dict] = None

# Cached key validation: {"valid": bool, "error": str|None, "ts": float}
_key_check: Optional[dict] = None
KEY_CHECK_TTL = 120  # seconds

def _today_pt() -> str:
    """Return today's date string in Pacific Time."""
    return datetime.now(_PT).strftime("%Y-%m-%d")


def _prune() -> None:
    """Remove timestamps older than the window."""
    cutoff = time.time() - WINDOW
    while _timestamps and _timestamps[0] < cutoff:
        _timestamps.pop(0)


def record_request() -> None:
    """Record a new request timestamp (RPM + RPD)."""
    with _lock:
        _timestamps.append(time.time())
        _prune()
        # RPD counter — reset if day changed
        today = _today_pt()
        if _daily["date"] != today:
            _daily["date"] = today
            _daily["count"] = 0
        _daily["count"] += 1


def record_429() -> None:
    """Record that a 429 was received."""
    global _last_429
    with _lock:
        _last_429 = time.time()


def record_error(error_type: str, message: str) -> None:
    """Record a recent API error (quota, auth, other)."""
    global _last_error
    # Treat quota errors also as 429
    if error_type in ("quota", "rate_limit"):
        record_429()
    with _lock:
        _last_error = {"type": error_type, "message": message, "ts": time.time()}


def get_recent_error(max_age: int = 300) -> Optional[dict]:
    """Return the last error if it happened within max_age seconds, else None."""
    with _lock:
        if _last_error is None:
            return None
        age = time.time() - _last_error["ts"]
        if age > max_age:
            return None
        return {
            "type": _last_error["type"],
            "message": _last_error["message"],
            "seconds_ago": round(age, 1),
        }


def set_key_check(valid: bool, error: Optional[str] = None) -> None:
    """Cache a key validation result."""
    global _key_check
    with _lock:
        _key_check = {"valid": valid, "error": error, "ts": time.time()}


def get_key_check() -> Optional[dict]:
    """Return cached key check if still fresh, else None."""
    with _lock:
        if _key_check is None:
            return None
        if time.time() - _key_check["ts"] > KEY_CHECK_TTL:
            return None
        return {"valid": _key_check["valid"], "error": _key_check["error"]}


def invalidate_key_cache() -> None:
    """Force next validate_api_key to re-check."""
    global _key_check
    with _lock:
        _key_check = None


def get_status() -> dict:
    """Return current rate-limit status (RPM, RPD, tier, model)."""
    with _lock:
        _prune()
        used = len(_timestamps)
        remaining = max(0, RPM_LIMIT - used)
        now = time.time()

        is_limited = False
        limited_seconds_ago = None
        if _last_429 is not None:
            age = now - _last_429
            if age < WINDOW:
                is_limited = True
                limited_seconds_ago = round(age, 1)

        reset_seconds = 0.0
        if _timestamps:
            oldest = _timestamps[0]
            reset_seconds = max(0.0, round(WINDOW - (now - oldest), 1))

        # RPD
        today = _today_pt()
        if _daily["date"] != today:
            rpd_used = 0
        else:
            rpd_used = _daily["count"]
        rpd_remaining = max(0, RPD_LIMIT - rpd_used)

        # Key validation info
        key_valid = None
        key_error = None
        if _key_check is not None and (now - _key_check["ts"]) <= KEY_CHECK_TTL:
            key_valid = _key_check["valid"]
            key_error = _key_check["error"]

        # Last error info
        last_error = None
        if _last_error is not None:
            err_age = now - _last_error["ts"]
            if err_age < 300:
                last_error = {
                    "type": _last_error["type"],
                    "message": _last_error["message"],
                    "seconds_ago": round(err_age, 1),
                }

        return {
            # RPM
            "used": used,
            "remaining": remaining,
            "rpm_limit": RPM_LIMIT,
            # RPD
            "rpd_used": rpd_used,
            "rpd_remaining": rpd_remaining,
            "rpd_limit": RPD_LIMIT,
            # TPM (informational)
            "tpm_limit": TPM_LIMIT,
            # Rate-limit state
            "is_limited": is_limited,
            "limited_seconds_ago": limited_seconds_ago,
            "reset_seconds": reset_seconds,
            # Tier & model
            "tier": TIER,
            "model": MODEL_ID,
            # Key & errors
            "key_valid": key_valid,
            "key_error": key_error,
            "last_error": last_error,
        }
