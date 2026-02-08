"""Gemini API client."""
from flask import current_app

_gen_model = None


def get_model():
    """Get or create the Gemini model instance."""
    global _gen_model
    if _gen_model is None:
        import google.generativeai as genai

        api_key = current_app.config.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        _gen_model = genai.GenerativeModel("gemini-1.5-flash")
    return _gen_model


def generate_content(system_prompt: str, user_message: str) -> str:
    """
    Generate content using Gemini.
    Returns the raw text response.
    """
    model = get_model()
    # Combine system prompt and user message
    full_prompt = f"{system_prompt}\n\n---\n\nDocument to analyze:\n\n{user_message}"
    response = model.generate_content(full_prompt)
    return response.text if response.text else ""
