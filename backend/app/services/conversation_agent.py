"""Conversation agent: BA chat with history; router selects agent(s), multiple agents may collaborate."""
import logging
from pathlib import Path
from typing import Optional

from app.agents.base import get_agent_bot_info
from app.models import Message, Conversation
from app.services.agent_router import (
    get_agent_info_from_config,
    load_agents_config,
    refactor_requirement_for_llm,
    route_to_agents,
)
from app.services.claude_client import generate_chat

logger = logging.getLogger(__name__)

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


def _build_identity_instruction(selected_agents: list[dict]) -> str:
    """
    Build explicit identity instruction so the LLM introduces itself with the correct name.
    Prevents the model from defaulting to 'Alex' when the router selected another agent (e.g. Emma).
    """
    names = [a.get("name", "").strip() for a in selected_agents if a.get("name")]
    names = [n for n in names if n]
    if not names:
        return ""
    if len(names) == 1:
        name = names[0]
        return (
            f"[IDENTITY]\n"
            f"Your name is {name}. When you introduce yourself, say only that you are {name} (e.g. \"Tôi là {name}\" or \"I am {name}\").\n"
            f"Do not say you are any other agent (e.g. do not say you are Alex, Paul, Sarah, or David unless your name is that agent).\n"
            f"You are speaking as {name} alone; do not refer to other agents as if they were separate from you in this reply."
        )
    # Multiple agents: one coherent voice; primary name for introduction = first selected
    primary = names[0]
    others = ", ".join(names[1:])
    return (
        f"[IDENTITY]\n"
        f"You are answering as a single voice that combines the perspectives of: {primary}, {others}.\n"
        f"When you introduce yourself, use the primary identity \"{primary}\" (e.g. \"Tôi là {primary}\" or \"I am {primary}\"), "
        f"and you may add that you are incorporating inputs from {others} where relevant.\n"
        f"Do not say you are Alex, or any agent not in the list above, unless that agent is one of: {', '.join(names)}."
    )


def _build_multi_agent_system_prompt(selected_agents: list[dict]) -> str:
    """Build system prompt when agent(s) are selected; includes explicit identity to avoid wrong name (e.g. Alex)."""
    base = get_conversation_system_prompt()
    parts = [base, ""]

    # Explicit identity so the model uses the selected agent's name, not a default like Alex
    identity_block = _build_identity_instruction(selected_agents)
    if identity_block:
        parts.append(identity_block)
        parts.append("")

    parts.append(
        "You are responding as the following agent(s). Coordinate your answer from these perspectives:"
    )
    for a in selected_agents:
        parts.append(
            f"- {a.get('name', '')} ({a.get('responsibility', '')}): {a.get('description', '').strip()}"
        )
    parts.append("")
    parts.append("Give one coherent reply that combines these viewpoints when relevant.")
    return "\n".join(parts)


def get_conversation_bot(primary_agent_id: Optional[str] = None) -> dict:
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
    First runs intelligent requirement analyzer to refactor user input; routing and
    reply use the refactored requirement so the LLM understands correctly.
    Returns (reply_text, selected_agent_ids). Caller may use selected_agent_ids[0] for bot.
    """
    refactored_content = refactor_requirement_for_llm(new_user_content)
    selected_ids, out_of_scope = route_to_agents(refactored_content)
    agents_config = load_agents_config()
    selected_agents = [a for a in agents_config if a.get("id") in selected_ids]
    if selected_agents:
        system_prompt = _build_multi_agent_system_prompt(selected_agents)
    else:
        system_prompt = get_conversation_system_prompt()

    # ── Inject project-wide document context (RAG summaries) ─────────────
    # All RAG-processed documents in the project are available to every
    # conversation, so the agent has knowledge of uploaded materials
    # without needing the user to re-attach them each time.
    try:
        conv = Conversation.query.get(conversation_id)
        if conv:
            from app.services.document_rag import build_project_documents_context
            doc_context = build_project_documents_context(conv.project_id)
            if doc_context:
                system_prompt = f"{system_prompt}\n\n{doc_context}"
    except Exception as exc:
        logger.warning("Failed to inject project docs context: %s", exc)

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
    reply_text = generate_chat(system_prompt, history, refactored_content)
    return reply_text, selected_ids
