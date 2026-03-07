"""
Router: infers which agent(s) should handle the user's question or input.
Reads conversation-agents.yaml and uses the LLM to select one or more agents.

Includes intelligent requirement analyzer: before routing, user input is
analyzed and refactored (GIVEN DATA, USER GOAL, IMPLICIT ASSUMPTIONS,
MISSING INFORMATION) so Gemini receives a clear, structured requirement.
"""
import json
import re
from pathlib import Path
from typing import Optional

from app.services.gemini_client import generate_text

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
CONVERSATION_AGENTS_CONFIG = (
    WORKSPACE_ROOT / "src" / "modules" / "ba-analysis" / "config" / "conversation-agents.yaml"
)

_agents_config_cache = None

# --- Intelligent requirement analyzer ---

REQUIREMENT_ANALYSIS_KEYS = (
    "given_data",
    "user_goal",
    "implicit_assumptions",
    "missing_information",
    "refactored_requirement",
)


def _build_requirement_analyzer_prompt(user_message: str) -> str:
    """Build prompt for analyzing and refactoring user requirement."""
    return """You are a requirement analyzer. Analyze the user message and output exactly one JSON object. Do not assign to any agent.

Rules:
- Extract only what is explicitly stated; do not assume or hallucinate.
- If the goal is unclear, say so in user_goal.
- Output valid JSON only; no markdown, no extra text.

JSON keys:
- given_data: array of strings — explicit facts, numbers, constraints stated by the user.
- user_goal: string — what the user wants. If unclear: "Unclear" and brief reason.
- implicit_assumptions: array of strings — inferences from context. Use [] if none.
- missing_information: array of strings — critical info not provided. Use [] if none.
- refactored_requirement: string — one clear paragraph restating the requirement for an LLM. Use the same language as the user; preserve all explicit facts; do not add assumptions.

Example shape:
{"given_data": [], "user_goal": "", "implicit_assumptions": [], "missing_information": [], "refactored_requirement": ""}

User message:

""" + (user_message[:8000] if user_message else "(empty)")


def analyze_and_refactor_requirement(user_message: str) -> tuple[dict, str]:
    """
    Analyze user requirement into GIVEN DATA, USER GOAL, IMPLICIT ASSUMPTIONS, MISSING INFORMATION,
    and produce a refactored requirement string for Gemini.
    Returns (analysis_dict, refactored_requirement_str).
    On failure, returns ({}, user_message) so callers can fall back to original.
    """
    if not (user_message or "").strip():
        return {}, user_message or ""

    prompt = _build_requirement_analyzer_prompt(user_message)
    try:
        text = generate_text(prompt).strip()
    except Exception:
        return {}, user_message

    # Extract JSON object (allow markdown code block or raw JSON)
    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        return {}, user_message

    try:
        data = json.loads(json_match.group())
    except json.JSONDecodeError:
        return {}, user_message

    if not isinstance(data, dict):
        return {}, user_message

    refactored = (data.get("refactored_requirement") or "").strip()
    if not refactored:
        refactored = user_message

    analysis = {k: data.get(k) for k in REQUIREMENT_ANALYSIS_KEYS if k in data}
    return analysis, refactored


def refactor_requirement_for_gemini(user_message: str) -> str:
    """
    Refactor the user's input requirement so Gemini understands it correctly.
    Runs the intelligent requirement analyzer; returns the refactored requirement string.
    On analyzer failure, returns the original user_message.
    """
    _, refactored = analyze_and_refactor_requirement(user_message)
    return refactored if refactored else user_message


# --- Agent routing ---
def _agent_mention_patterns(agents: list[dict]) -> list[tuple[str, str]]:
    """Return [(pattern, agent_id), ...] for whole-word mention of agent name or id."""
    result = []
    for a in agents:
        aid = a.get("id") or ""
        name = (a.get("name") or "").strip()
        if aid:
            result.append((rf"(?:\b{re.escape(aid)}\b)", aid))
        if name and name != aid:
            result.append((rf"(?:\b{re.escape(name)}\b)", aid))
    return result


def _detect_mentioned_agent(user_message: str, agents: list[dict]) -> Optional[list[str]]:
    """
    If the user explicitly mentions an agent by name or id (e.g. 'Emma', 'ask Emma', 'emma'),
    return that agent's id(s) so we route to them. Otherwise return None.
    """
    if not (user_message or "").strip() or not agents:
        return None
    mentioned_ids = []
    seen = set()
    for pattern, agent_id in _agent_mention_patterns(agents):
        if re.search(pattern, user_message, re.IGNORECASE) and agent_id not in seen:
            mentioned_ids.append(agent_id)
            seen.add(agent_id)
    return mentioned_ids if mentioned_ids else None


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
    agent_list = "\n".join(
        f"- id: {a.get('id', '')} | {a.get('name', '')} — {a.get('responsibility', '')}. {a.get('description', '').strip()[:180]}"
        for a in agents
    )
    specialist_ids = [a.get("id") for a in agents if (a.get("id") or "").lower() != "alex"]
    specialist_list = ", ".join(specialist_ids) if specialist_ids else "none"

    return f"""You are a router. Choose which agent(s) should handle this request.

Agents (id | name — responsibility. description):
{agent_list}

User message:
{user_message[:2000]}

Rules:
- Reply with ONLY one JSON object: {{"agent_ids": ["id1", "id2"], "out_of_scope": false}}.
- agent_ids: array of agent ids that best match the request (e.g. ["emma"] or ["emma", "sarah"]).
- out_of_scope: set to true only when the request does NOT fit any specialist ({specialist_list}). In that case reply with {{"agent_ids": ["alex"], "out_of_scope": true}} so the user is told Alex was assigned.
- Prefer one agent when one clearly fits; use multiple only when the request spans responsibilities.
- Valid ids: {", ".join(a.get("id", "") for a in agents)}.

Reply (JSON only):"""


def route_to_agents(user_message: str) -> tuple[list[str], bool]:
    """
    Infer which agent(s) should handle the user message.
    If the user mentions an agent by name or id (e.g. "Emma", "ask Emma"), that agent is selected.
    Returns (agent_ids, out_of_scope) where out_of_scope is True when the request was assigned to Alex
    because it did not fit any specialist (so the caller can tell the user).
    """
    agents = load_agents_config()
    if not agents:
        return ["alex"], True

    # If user explicitly mentions an agent name/id, route to that agent
    mentioned = _detect_mentioned_agent(user_message or "", agents)
    if mentioned:
        return mentioned, False

    prompt = _build_router_prompt(agents, user_message or "")
    try:
        text = generate_text(prompt).strip()
    except Exception:
        return [agents[0]["id"]], False

    valid_ids = {a["id"] for a in agents}
    # Prefer new format: {"agent_ids": [...], "out_of_scope": bool}
    obj_match = re.search(r"\{[\s\S]*\}", text)
    if obj_match:
        try:
            data = json.loads(obj_match.group())
            if isinstance(data, dict):
                ids = data.get("agent_ids")
                out_of_scope = data.get("out_of_scope") is True
                if isinstance(ids, list):
                    selected = [x for x in ids if isinstance(x, str) and x in valid_ids]
                    if selected:
                        return selected, out_of_scope
        except json.JSONDecodeError:
            pass

    # Fallback: try legacy array format [id1, id2]
    match = re.search(r"\[[\s\S]*?\]", text)
    if match:
        try:
            ids = json.loads(match.group())
            if isinstance(ids, list):
                selected = [x for x in ids if isinstance(x, str) and x in valid_ids]
                if selected:
                    return selected, selected == ["alex"]
        except (json.JSONDecodeError, TypeError):
            pass

    return [agents[0]["id"]], False


def get_agent_info_from_config(agent_id: str) -> Optional[dict]:
    """Return { name, avatar, role } for an agent id from conversation-agents config."""
    for a in load_agents_config():
        if a.get("id") == agent_id:
            return {
                "name": a.get("name", agent_id.title()),
                "avatar": a.get("avatar", ""),
                "role": "assistant",
            }
    return None
