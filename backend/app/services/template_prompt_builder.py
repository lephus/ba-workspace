"""
Build token-optimized prompts for template-based document export.

Design principles:
  - Compact schema (~200-400 tokens) instead of full template text
  - Conversation history truncated to last N messages
  - Strict JSON-only output format for reliable parsing
  - Anti-hallucination rules baked into every prompt
"""
import json
from typing import Optional

from app.models import Message
from app.services.template_registry import (
    get_schema,
    schema_to_compact_prompt,
    schema_to_json_spec,
)

MAX_HISTORY_MESSAGES = 30
MAX_MESSAGE_CHARS = 500


def _truncate_history(conversation_id: int) -> str:
    """
    Load the last N messages from the conversation and format them
    as a compact block for the prompt.  Each message is capped to
    MAX_MESSAGE_CHARS to control token usage.
    """
    messages = (
        Message.query.filter_by(conversation_id=conversation_id)
        .filter(Message.role.in_(["user", "assistant"]))
        .order_by(Message.created_at.asc())
        .all()
    )
    recent = messages[-MAX_HISTORY_MESSAGES:] if len(messages) > MAX_HISTORY_MESSAGES else messages
    if not recent:
        return "(no conversation history)"

    lines = []
    for m in recent:
        content = (m.content or "").strip()
        if len(content) > MAX_MESSAGE_CHARS:
            content = content[:MAX_MESSAGE_CHARS] + "..."
        role_tag = "USER" if m.role == "user" else "ASSISTANT"
        lines.append(f"[{role_tag}] {content}")
    return "\n".join(lines)


def build_export_prompt(template_type: str, conversation_id: int) -> str:
    """
    Build the full prompt sent to Gemini for template data generation.

    Structure (token budget ~3,500 total):
      [ROLE]       ~30 tokens
      [TASK]       ~20 tokens
      [SCHEMA]     ~200-400 tokens
      [FORMAT]     ~100-200 tokens
      [RULES]      ~80 tokens
      [HISTORY]    ~2,500-3,000 tokens
    """
    schema = get_schema(template_type)
    compact_schema = schema_to_compact_prompt(schema)
    json_spec = schema_to_json_spec(schema)
    history_block = _truncate_history(conversation_id)

    return f"""[ROLE]
You are a BA Document Data Extractor. Output ONLY valid JSON.

[TASK]
Extract information from the conversation below to fill a {schema['name']}.

[SCHEMA]
{compact_schema}

[FORMAT]
Return a single JSON object with this exact structure:
{json_spec}

For "table" sections: return an array of objects (one per row). Generate appropriate IDs (BR-01, FR-01, PB-01, etc.).
For "fields" sections: return an object with each field as a key.
For "text" sections: return a single string with paragraph content.

[RULES]
1. Use ONLY facts explicitly stated or clearly implied in the conversation.
2. For unknown or unmentioned fields, use exactly "[TBD]" as the value.
3. Do NOT invent names, dates, numbers, or requirements not in the conversation.
4. Dates format: DD/MM/YYYY. Priority values: Must Have | Should Have | Could Have | Won't Have.
5. Return raw JSON only. No markdown fences, no explanation, no extra text.

[CONVERSATION]
{history_block}"""


def parse_llm_json(raw_text: str) -> Optional[dict]:
    """
    Parse the LLM response as JSON.  Handles common issues:
    - Markdown code fences (```json ... ```)
    - Leading/trailing whitespace
    Returns the parsed dict, or None if parsing fails.
    """
    text = raw_text.strip()

    if text.startswith("```"):
        first_nl = text.find("\n")
        if first_nl != -1:
            text = text[first_nl + 1:]
        if text.endswith("```"):
            text = text[:-3].strip()

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except (json.JSONDecodeError, TypeError):
        pass

    return None


def validate_template_data(template_type: str, data: dict) -> tuple[bool, list[str]]:
    """
    Validate that the parsed JSON data has all required sections
    from the schema.  Returns (is_valid, list_of_warnings).
    A missing section is a warning, not a hard failure —
    partial data is still usable.
    """
    schema = get_schema(template_type)
    warnings: list[str] = []

    for sec in schema["sections"]:
        sec_id = sec["id"]
        if sec_id not in data:
            warnings.append(f"Missing section: {sec_id}")
            continue

        value = data[sec_id]
        sec_type = sec["type"]

        if sec_type == "columnar" and not isinstance(value, list):
            warnings.append(f"Section {sec_id}: expected array, got {type(value).__name__}")
        elif sec_type in ("key_value", "two_column") and not isinstance(value, dict):
            warnings.append(f"Section {sec_id}: expected object, got {type(value).__name__}")
        elif sec_type == "text_block" and not isinstance(value, str):
            warnings.append(f"Section {sec_id}: expected string, got {type(value).__name__}")

    is_valid = len([w for w in warnings if w.startswith("Missing section")]) < len(schema["sections"])
    return is_valid, warnings
