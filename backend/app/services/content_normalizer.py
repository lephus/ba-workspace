"""
Normalize user message content for prompts and storage.

Accepts:
- Plain string: "a single message"
- Structured (GPT-style): { "content_type": "text", "parts": ["part one", "part two"] }

Parts are logical segments (e.g. paragraphs, bullets, sentences). We trim each part,
drop empty ones, and join with double newline so the prompt has clear structure for Gemini.
"""

# Maximum number of parts to avoid abuse
MAX_PARTS = 50
# Maximum total length after normalization (chars)
MAX_NORMALIZED_LENGTH = 50_000


def normalize_user_content(content) -> str:
    """
    Normalize content from API into a single string for DB storage and prompt.

    - If content is str: return stripped string.
    - If content is dict: expect content_type "text" and parts (list of strings).
      Parts are trimmed, empty parts removed, joined with "\\n\\n".
    - Invalid format raises ValueError (caller returns 400).
    """
    if content is None:
        raise ValueError("content is required")

    if isinstance(content, str):
        out = content.strip()
        if len(out) > MAX_NORMALIZED_LENGTH:
            out = out[:MAX_NORMALIZED_LENGTH]
        return out

    if isinstance(content, dict):
        if content.get("content_type") != "text":
            raise ValueError(
                "content.content_type must be \"text\". Other types may be supported later."
            )
        raw_parts = content.get("parts")
        if not isinstance(raw_parts, list):
            raise ValueError("content.parts must be an array of strings")
        if len(raw_parts) > MAX_PARTS:
            raise ValueError(f"content.parts must have at most {MAX_PARTS} items")
        parts = []
        for i, p in enumerate(raw_parts):
            if not isinstance(p, str):
                raise ValueError(f"content.parts[{i}] must be a string")
            trimmed = p.strip()
            if trimmed:
                parts.append(trimmed)
        out = "\n\n".join(parts)
        if len(out) > MAX_NORMALIZED_LENGTH:
            out = out[:MAX_NORMALIZED_LENGTH]
        return out

    raise ValueError("content must be a string or an object { content_type, parts }")
