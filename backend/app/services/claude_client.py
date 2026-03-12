"""Claude (Anthropic) API client with multi-key rotation support."""
import logging
from typing import Optional

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

MODEL_ID = "claude-3-5-sonnet-20241022"
MAX_TOKENS = 8096

# Cache clients keyed by api_key string
_clients: dict[str, object] = {}
_configured_key: Optional[str] = None


class ClaudeRateLimitError(Exception):
    """Raised when Claude returns a 429 rate-limit / quota error."""
    pass


class ClaudeAuthError(Exception):
    """Raised when the Anthropic API key is invalid or expired."""
    pass


def _get_active_key() -> str:
    """Get the current best API key via the key manager."""
    from app.services.key_manager import get_current_api_key
    return get_current_api_key()


def _get_client(api_key: Optional[str] = None):
    """Return an anthropic.Anthropic client for the given (or active) key."""
    global _configured_key
    import anthropic

    key = api_key or _get_active_key()
    if key not in _clients:
        _clients[key] = anthropic.Anthropic(api_key=key)
    _configured_key = key
    return _clients[key]


def validate_api_key() -> dict:
    """
    Validate the Claude API key.
    - If there's a recent quota/rate error (< 300s), report it directly.
    - Otherwise call models.list() to verify the key is valid.
    Returns: {"valid": bool, "error": str|None}
    """
    import anthropic

    # 1) If we have a recent quota error, the key IS valid but quota is exhausted
    recent = get_recent_error(max_age=300)
    if recent and recent["type"] in ("quota", "rate_limit"):
        set_key_check(valid=True, error=recent["message"])
        return {"valid": True, "error": recent["message"]}

    # 2) Return cached key check if still fresh
    cached = get_key_check()
    if cached is not None:
        return {"valid": cached["valid"], "error": cached["error"]}

    # 3) Call models.list() to verify the key itself (auth check only)
    try:
        client = _get_client()
        list(client.models.list())
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
            error_text = f"Lỗi kết nối Claude API: {str(e)[:150]}"
            set_key_check(valid=False, error=error_text)
            record_error("other", error_text)
            return {"valid": False, "error": error_text}


def generate_text(prompt: str, system_prompt: Optional[str] = None) -> str:
    """
    Simple single-turn text generation with full error handling and key rotation.
    Use this for any one-off Claude call (e.g. agent routing).
    Raises ClaudeRateLimitError or ClaudeAuthError on API errors.
    """
    from app.services.key_manager import rotate_key, mark_key_used

    max_retries = 5
    last_exception = None

    for attempt in range(max_retries):
        current_key = _get_active_key()
        client = _get_client(current_key)
        record_request()
        try:
            kwargs: dict = {
                "model": MODEL_ID,
                "max_tokens": MAX_TOKENS,
                "messages": [{"role": "user", "content": prompt}],
            }
            if system_prompt:
                kwargs["system"] = system_prompt
            response = client.messages.create(**kwargs)
            mark_key_used(current_key)
            return response.content[0].text if response.content else ""
        except Exception as e:
            last_exception = e
            if _is_quota_or_rate_error(e) or _is_auth_error(e):
                error_msg = str(e)[:200]
                logger.warning("Key %s...%s failed (attempt %d): %s",
                               current_key[:8], current_key[-4:], attempt + 1, error_msg)
                try:
                    rotate_key(current_key, error_msg)
                    logger.info("Rotated to new key, retrying...")
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


def generate_content(system_prompt: str, user_message: str) -> str:
    """
    Generate content using Claude (single turn, with system prompt).
    Returns the raw text response.
    """
    return generate_text(user_message, system_prompt=system_prompt)


def generate_chat(system_prompt: str, messages: list[dict], new_user_content: str) -> str:
    """
    Multi-turn chat with conversation history and key rotation.
    messages: list of {"role": "user"|"assistant", "content": str}
    new_user_content: the latest user message.
    Returns the model reply as text.
    """
    from app.services.key_manager import rotate_key, mark_key_used

    history = []
    for m in messages:
        role = m.get("role", "user")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if role in ("user", "assistant"):
            history.append({"role": role, "content": content})

    # Ensure messages alternate correctly (Claude requires user/assistant alternation)
    # Also ensure the last message before the new one is not from the user
    claude_messages = history + [{"role": "user", "content": new_user_content}]

    max_retries = 5
    last_exception = None

    for attempt in range(max_retries):
        current_key = _get_active_key()
        client = _get_client(current_key)
        record_request()
        try:
            response = client.messages.create(
                model=MODEL_ID,
                max_tokens=MAX_TOKENS,
                system=system_prompt,
                messages=claude_messages,
            )
            mark_key_used(current_key)
            return response.content[0].text if response.content else ""
        except Exception as e:
            last_exception = e
            if _is_quota_or_rate_error(e) or _is_auth_error(e):
                error_msg = str(e)[:200]
                logger.warning("Key %s...%s failed in chat (attempt %d): %s",
                               current_key[:8], current_key[-4:], attempt + 1, error_msg)
                try:
                    rotate_key(current_key, error_msg)
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
        raise ClaudeRateLimitError(msg) from e
    if _is_auth_error(e):
        record_error("auth", "API key không hợp lệ hoặc đã hết hạn")
        invalidate_key_cache()
        raise ClaudeAuthError(
            "API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra ANTHROPIC_API_KEY."
        ) from e
    record_error("other", str(e)[:200])


def _is_quota_or_rate_error(e: Exception) -> bool:
    """Check if an exception is a 429 / quota / rate-limit error."""
    try:
        import anthropic
        if isinstance(e, anthropic.RateLimitError):
            return True
    except ImportError:
        pass
    err_str = str(e).lower()
    if "429" in err_str or "rate_limit" in err_str or "overloaded" in err_str:
        return True
    type_name = type(e).__name__.lower()
    if "ratelimit" in type_name or "overloaded" in type_name:
        return True
    return False


def _is_auth_error(e: Exception) -> bool:
    """Check if an exception is an authentication/authorization error."""
    try:
        import anthropic
        if isinstance(e, anthropic.AuthenticationError):
            return True
    except ImportError:
        pass
    err_str = str(e).lower()
    if any(kw in err_str for kw in ("401", "403", "invalid api key", "api_key_invalid",
                                     "permission_denied", "authentication",
                                     "unauthorized", "forbidden")):
        return True
    type_name = type(e).__name__.lower()
    if any(kw in type_name for kw in ("authentication", "unauthorized", "forbidden")):
        return True
    return False


def _extract_quota_message(e: Exception) -> str:
    """Extract a user-friendly message from a quota/rate error."""
    err_str = str(e)
    if "overloaded" in err_str.lower():
        return "Claude API đang quá tải. Vui lòng thử lại sau."
    if "429" in err_str or "rate_limit" in err_str.lower():
        return "Claude API bị giới hạn tốc độ (429). Vui lòng đợi."
    return f"Claude API rate limit: {err_str[:100]}"
