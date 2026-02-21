"""Conversation agent: BA chat with history; router selects agent(s), multiple agents may collaborate."""
from pathlib import Path

from app.agents.base import get_agent_bot_info
from app.models import Message
from app.services.agent_router import (
    get_agent_info_from_config,
    load_agents_config,
    route_to_agents,
)
from app.services.gemini_client import generate_chat

# Fallback when config has no agents or router returns none
CONVERSATION_AGENT_ID = "alex"

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BA_CONVERSATION_PROMPT_PATH = (
    WORKSPACE_ROOT / "src" / "modules" / "ba-analysis" / "prompts" / "ba_conversation.prompt.txt"
)


def get_conversation_system_prompt() -> str:
    """Load BA conversation system prompt from module prompts."""
    if BA_CONVERSATION_PROMPT_PATH.exists():
        return BA_CONVERSATION_PROMPT_PATH.read_text(encoding="utf-8").strip()
    return (
        "You are a Senior Business Analyst. Answer the user's questions clearly. "
        "When information is missing, ask concise follow-up questions to clarify. "
        "Steer the conversation toward standard BA artifacts (requirements, user stories, acceptance criteria)."
    )


def _build_multi_agent_system_prompt(selected_agents: list[dict]) -> str:
    """Build system prompt when multiple agents are selected (collaboration)."""
    base = get_conversation_system_prompt()
    parts = [
        base,
        "",
        "You are responding as the following agent(s). Coordinate your answer from these perspectives:",
    ]
    for a in selected_agents:
        parts.append(f"- {a.get('name', '')} ({a.get('responsibility', '')}): {a.get('description', '').strip()}")
    parts.append("")
    parts.append("Give one coherent reply that combines these viewpoints when relevant.")
    return "\n".join(parts)


def get_conversation_bot(primary_agent_id: str | None = None) -> dict:
    """
    Return bot info { name, avatar, role }.
    If primary_agent_id is in conversation-agents config, use it; else fallback to get_agent_bot_info (alex).
    """
    if primary_agent_id:
        info = get_agent_info_from_config(primary_agent_id)
        if info:
            return info
    return get_agent_bot_info(CONVERSATION_AGENT_ID)


def get_agent_reply(conversation_id: int, new_user_content: str) -> tuple[str, list[str]]:
    """
    Infer which agent(s) to use, build combined prompt when multiple agents, then reply.
    Returns (reply_text, selected_agent_ids). Caller may use selected_agent_ids[0] for bot.
    """
    selected_ids = route_to_agents(new_user_content)
    agents_config = load_agents_config()
    selected_agents = [a for a in agents_config if a.get("id") in selected_ids]
    if selected_agents:
        system_prompt = _build_multi_agent_system_prompt(selected_agents)
    else:
        system_prompt = get_conversation_system_prompt()

    messages = (
        Message.query.filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    history = [
        {"role": m.role, "content": m.content or ""}
        for m in messages
        if m.role in ("user", "assistant")
    ]
    reply_text = generate_chat(system_prompt, history, new_user_content)
    return reply_text, selected_ids
