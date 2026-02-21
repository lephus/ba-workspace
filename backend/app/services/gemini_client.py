"""Gemini API client."""
from flask import current_app

_gen_model = None
_genai = None


def _ensure_configured():
    global _genai
    if _genai is None:
        import google.generativeai as genai

        api_key = current_app.config.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        _genai = genai
    return _genai


def get_model():
    """Get or create the Gemini model instance (single-turn)."""
    global _gen_model
    _ensure_configured()
    if _gen_model is None:
        _gen_model = _genai.GenerativeModel("gemini-2.5-flash")
    return _gen_model


def generate_content(system_prompt: str, user_message: str) -> str:
    """
    Generate content using Gemini (single turn).
    Returns the raw text response.
    """
    model = get_model()
    full_prompt = f"{system_prompt}\n\n---\n\nDocument to analyze:\n\n{user_message}"
    response = model.generate_content(full_prompt)
    return response.text if response.text else ""


def generate_chat(system_prompt: str, messages: list[dict], new_user_content: str) -> str:
    """
    Multi-turn chat with conversation history.
    messages: list of {"role": "user"|"assistant", "content": str}
    new_user_content: the latest user message (will be sent via send_message).
    Returns the model reply as text.
    """
    import google.generativeai as genai

    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)

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

    chat = model.start_chat(history=history)
    response = chat.send_message(new_user_content)
    return response.text if response.text else ""
