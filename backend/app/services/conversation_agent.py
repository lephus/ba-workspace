"""Conversation agent: BA chat with history (answer + follow-up questions toward BA docs)."""
from pathlib import Path

from app.models import Message
from app.services.gemini_client import generate_chat


# Prompt file next to module prompts (workspace root = backend's parent's parent's parent)
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BA_CONVERSATION_PROMPT_PATH = (
    WORKSPACE_ROOT / "src" / "modules" / "ba-analysis" / "prompts" / "ba_conversation.prompt.txt"
)


def get_conversation_system_prompt() -> str:
    """Load BA conversation system prompt from module prompts."""
    if BA_CONVERSATION_PROMPT_PATH.exists():
        return BA_CONVERSATION_PROMPT_PATH.read_text(encoding="utf-8").strip()
    # Fallback if file not found (e.g. running from different cwd)
    return (
        "You are a Senior Business Analyst. Answer the user's questions clearly. "
        "When information is missing, ask concise follow-up questions to clarify. "
        "Steer the conversation toward standard BA artifacts (requirements, user stories, acceptance criteria)."
    )


def get_agent_reply(conversation_id: int, new_user_content: str) -> str:
    """
    Get assistant reply for a conversation turn.
    Loads message history for the conversation (user + assistant only), sends history
    and new_user_content to Gemini chat, returns the model reply.
    Does not persist anything; caller saves the assistant message if needed.
    """
    messages = (
        Message.query.filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    # Only user and assistant for chat history (no system in Gemini history)
    history = [
        {"role": m.role, "content": m.content or ""}
        for m in messages
        if m.role in ("user", "assistant")
    ]
    system_prompt = get_conversation_system_prompt()
    return generate_chat(system_prompt, history, new_user_content)
