"""Gemini API client with multi-key rotation support."""
import logging
from flask import current_app
from app.services.rate_limiter import (
    record_request,
    record_429,
    record_error,
    set_key_check,
    get_key_check,
    get_recent_error,
    invalidate_key_cache,
)

logger = logging.getLogger(__name__)

# Track the key that the current _genai / _gen_model were configured with
_configured_key: str | None = None
_gen_model = None
_genai = None


class GeminiRateLimitError(Exception):
    """Raised when Gemini returns a 429 rate-limit / quota error."""
    pass


class GeminiAuthError(Exception):
    """Raised when the Gemini API key is invalid or expired."""
    pass


def _get_active_key() -> str:
    """Get the current best API key via the key manager."""
    from app.services.key_manager import get_current_api_key
    return get_current_api_key()


def _ensure_configured(force_key: str | None = None):
    """Configure genai with the current active key. Re-configures if key changed."""
    global _genai, _gen_model, _configured_key
    import google.generativeai as genai

    api_key = force_key or _get_active_key()

    if _genai is not None and _configured_key == api_key:
        return _genai

    # (Re-)configure with new/different key
    genai.configure(api_key=api_key)
    _genai = genai
    _gen_model = None  # invalidate cached model
    _configured_key = api_key
    return _genai


def get_model():
    """Get or create the Gemini model instance (single-turn)."""
    global _gen_model
    _ensure_configured()
    if _gen_model is None:
        _gen_model = _genai.GenerativeModel("gemini-2.5-flash")
    return _gen_model


def validate_api_key() -> dict:
    """
    Validate the Gemini API key and check generation quota.
    - If there's a recent quota/rate error (< 300s), report it directly
      (list_models doesn't share the same quota as generate_content).
    - Otherwise call list_models() to verify the key is valid.
    Returns: {"valid": bool, "error": str|None}
    """
    # 1) If we have a recent quota error, the key IS valid but quota is exhausted
    recent = get_recent_error(max_age=300)
    if recent and recent["type"] in ("quota", "rate_limit"):
        set_key_check(valid=True, error=recent["message"])
        return {"valid": True, "error": recent["message"]}

    # 2) Return cached key check if still fresh
    cached = get_key_check()
    if cached is not None:
        return {"valid": cached["valid"], "error": cached["error"]}

    # 3) Call list_models to verify the key itself (auth check only)
    try:
        genai = _ensure_configured()
        list(genai.list_models())
        set_key_check(valid=True)
        return {"valid": True, "error": None}
    except Exception as e:
        if _is_auth_error(e):
            error_text = "API key không hợp lệ hoặc đã hết hạn"
            set_key_check(valid=False, error=error_text)
            record_error("auth", error_text)
            return {"valid": False, "error": error_text}
        elif _is_quota_or_rate_error(e):
            error_text = _extract_quota_message(e)
            set_key_check(valid=True, error=error_text)
            record_error("quota", error_text)
            return {"valid": True, "error": error_text}
        else:
            error_text = f"Lỗi kết nối Gemini API: {str(e)[:150]}"
            set_key_check(valid=False, error=error_text)
            record_error("other", error_text)
            return {"valid": False, "error": error_text}


def generate_text(prompt: str) -> str:
    """
    Simple single-turn text generation with full error handling and key rotation.
    Use this for any one-off Gemini call (e.g. agent routing).
    Raises GeminiRateLimitError or GeminiAuthError on API errors.
    """
    from app.services.key_manager import rotate_key, mark_key_used

    max_retries = 5
    last_exception = None

    for attempt in range(max_retries):
        current_key = _get_active_key()
        _ensure_configured()
        model = get_model()
        record_request()
        try:
            response = model.generate_content(prompt)
            mark_key_used(current_key)
            return response.text if response.text else ""
        except Exception as e:
            last_exception = e
            if _is_quota_or_rate_error(e) or _is_auth_error(e):
                error_msg = str(e)[:200]
                logger.warning("Key %s...%s failed (attempt %d): %s",
                               current_key[:8], current_key[-4:], attempt + 1, error_msg)
                try:
                    rotate_key(current_key, error_msg)
                    _ensure_configured()  # reconfigure with new key
                    logger.info("Rotated to new key, retrying...")
                    continue
                except ValueError:
                    # No more keys available
                    _handle_api_error(e)
                    raise
            else:
                _handle_api_error(e)
                raise

    # All retries exhausted
    if last_exception:
        _handle_api_error(last_exception)
        raise last_exception


def generate_content(system_prompt: str, user_message: str) -> str:
    """
    Generate content using Gemini (single turn, with system prompt).
    Returns the raw text response.
    """
    full_prompt = f"{system_prompt}\n\n---\n\nDocument to analyze:\n\n{user_message}"
    return generate_text(full_prompt)


def generate_chat(system_prompt: str, messages: list[dict], new_user_content: str) -> str:
    """
    Multi-turn chat with conversation history and key rotation.
    messages: list of {"role": "user"|"assistant", "content": str}
    new_user_content: the latest user message (will be sent via send_message).
    Returns the model reply as text.
    """
    import google.generativeai as genai
    from app.services.key_manager import rotate_key, mark_key_used

    # Build history for Gemini: "user" and "model" (map assistant -> model)
    history = []
    for m in messages:
        role = m.get("role", "user")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if role == "assistant":
            history.append({"role": "model", "parts": [content]})
        elif role == "user":
            history.append({"role": "user", "parts": [content]})
        # skip system: already in system_instruction

    max_retries = 5
    last_exception = None

    for attempt in range(max_retries):
        current_key = _get_active_key()
        _ensure_configured()

        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
        chat = model.start_chat(history=history)
        record_request()
        try:
            response = chat.send_message(new_user_content)
            mark_key_used(current_key)
            return response.text if response.text else ""
        except Exception as e:
            last_exception = e
            if _is_quota_or_rate_error(e) or _is_auth_error(e):
                error_msg = str(e)[:200]
                logger.warning("Key %s...%s failed in chat (attempt %d): %s",
                               current_key[:8], current_key[-4:], attempt + 1, error_msg)
                try:
                    rotate_key(current_key, error_msg)
                    _ensure_configured()
                    logger.info("Rotated to new key, retrying chat...")
                    continue
                except ValueError:
                    _handle_api_error(e)
                    raise
            else:
                _handle_api_error(e)
                raise

    if last_exception:
        _handle_api_error(last_exception)
        raise last_exception


def _handle_api_error(e: Exception) -> None:
    """Classify and record an API error, then raise the appropriate typed exception."""
    if _is_quota_or_rate_error(e):
        record_429()
        msg = _extract_quota_message(e)
        record_error("quota", msg)
        invalidate_key_cache()
        raise GeminiRateLimitError(msg) from e
    if _is_auth_error(e):
        record_error("auth", "API key không hợp lệ hoặc đã hết hạn")
        invalidate_key_cache()
        raise GeminiAuthError(
            "API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra GEMINI_API_KEY."
        ) from e
    # Unknown error — still record it
    record_error("other", str(e)[:200])


def _is_quota_or_rate_error(e: Exception) -> bool:
    """Check if an exception is a 429 / quota / rate-limit error."""
    err_str = str(e).lower()
    if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
        return True
    type_name = type(e).__name__.lower()
    if "resourceexhausted" in type_name or "ratelimit" in type_name:
        return True
    return False


def _is_auth_error(e: Exception) -> bool:
    """Check if an exception is an authentication/authorization error."""
    err_str = str(e).lower()
    if any(kw in err_str for kw in ("401", "403", "invalid api key", "api_key_invalid",
                                     "permission_denied", "api key not valid",
                                     "api key expired")):
        return True
    type_name = type(e).__name__.lower()
    if any(kw in type_name for kw in ("permissiondenied", "unauthenticated",
                                       "forbidden", "unauthorized")):
        return True
    return False


def _extract_quota_message(e: Exception) -> str:
    """Extract a user-friendly message from a quota/rate error."""
    err_str = str(e)
    if "quota" in err_str.lower() and "free_tier" in err_str.lower():
        return "Đã hết quota miễn phí hôm nay. Vui lòng đợi hoặc nâng cấp plan."
    if "429" in err_str:
        return "Gemini API bị giới hạn tốc độ (429). Vui lòng đợi."
    return f"Gemini API quota/rate limit: {err_str[:100]}"
