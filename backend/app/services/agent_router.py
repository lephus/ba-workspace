"""
Router: infers which agent(s) should handle the user's question or input.
Reads conversation-agents.yaml and uses the LLM to select one or more agents.
"""
import json
import re
from pathlib import Path

from app.services.gemini_client import get_model

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
CONVERSATION_AGENTS_CONFIG = (
    WORKSPACE_ROOT / "src" / "modules" / "ba-analysis" / "config" / "conversation-agents.yaml"
)

_agents_config_cache = None


def load_agents_config() -> list[dict]:
    """Load and parse conversation-agents.yaml; return list of agent dicts."""
    global _agents_config_cache
    if _agents_config_cache is not None:
        return _agents_config_cache
    if not CONVERSATION_AGENTS_CONFIG.exists():
        _agents_config_cache = []
        return _agents_config_cache
    import yaml
    with open(CONVERSATION_AGENTS_CONFIG, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    _agents_config_cache = data.get("agents") or []
    return _agents_config_cache


def _build_router_prompt(agents: list[dict], user_message: str) -> str:
    """Build prompt for LLM to select which agent(s) handle the message."""
    lines = [
        "You are a router. Given the following agents and the user message, choose which agent(s) should handle this request.",
        "Reply with ONLY a JSON array of agent ids, e.g. [\"emma\"] or [\"emma\", \"sarah\"]. No other text.",
        "",
        "Agents:",
    ]
    for a in agents:
        lines.append(f"  - id: {a.get('id', '')}")
        lines.append(f"    responsibility: {a.get('responsibility', '')}")
        lines.append(f"    description: {a.get('description', '').strip()[:200]}")
        lines.append("")
    lines.append("User message:")
    lines.append(user_message[:2000])
    lines.append("")
    lines.append("Reply with JSON array of ids only:")
    return "\n".join(lines)


def route_to_agents(user_message: str) -> list[str]:
    """
    Infer which agent(s) should handle the user message.
    Returns list of agent ids (e.g. ["emma", "sarah"]). Uses config conversation-agents.yaml.
    """
    agents = load_agents_config()
    if not agents:
        return ["alex"]
    prompt = _build_router_prompt(agents, user_message or "")
    model = get_model()
    response = model.generate_content(prompt)
    text = (response.text or "").strip()
    # Parse JSON array from response (allow trailing text)
    match = re.search(r"\[[\s\S]*?\]", text)
    if not match:
        return [agents[0]["id"]]
    try:
        ids = json.loads(match.group())
        if not isinstance(ids, list):
            return [agents[0]["id"]]
        valid_ids = {a["id"] for a in agents}
        selected = [x for x in ids if isinstance(x, str) and x in valid_ids]
        return selected if selected else [agents[0]["id"]]
    except (json.JSONDecodeError, TypeError):
        return [agents[0]["id"]]


def get_agent_info_from_config(agent_id: str) -> dict | None:
    """Return { name, avatar, role } for an agent id from conversation-agents config."""
    for a in load_agents_config():
        if a.get("id") == agent_id:
            return {
                "name": a.get("name", agent_id.title()),
                "avatar": a.get("avatar", ""),
                "role": "assistant",
            }
    return None
