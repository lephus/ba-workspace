"""Messages API."""
from flask import Blueprint, jsonify, request

from app.models import Conversation, Message, Project, db
from app.services.content_normalizer import normalize_user_content
from app.services.conversation_agent import get_agent_reply, get_conversation_bot
from app.services.export_detector import detect_export_format
from app.services.export_service import EXPORT_EXT, save_export_to_project

bp = Blueprint("messages", __name__)


def _message_with_bot(msg: Message) -> dict:
    """
    Return message dict with bot (avatar, name, role) for assistant messages.
    Assistant message content is always Markdown; frontend should render with a Markdown parser.
    """
    d = msg.to_dict()
    if msg.role == "assistant":
        d["bot"] = get_conversation_bot(msg.agent_id)
    return d


@bp.route("/<int:project_id>/conversations/<int:conversation_id>/messages", methods=["GET"])
def list_messages(project_id, conversation_id):
    """
    List messages in a conversation
    ---
    tags:
      - Messages
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: conversation_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of messages
      404:
        description: Conversation not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    msgs = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.asc()).all()
    return jsonify([_message_with_bot(m) for m in msgs])


@bp.route("/<int:project_id>/conversations/<int:conversation_id>/messages", methods=["POST"])
def create_message(project_id, conversation_id):
    """
    Add a message to a conversation.
    When role is "user", the BA agent is triggered: an assistant reply is generated
    (using conversation history), saved, and returned along with the user message.
    ---
    tags:
      - Messages
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: conversation_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [role, content]
          properties:
            role: { type: string, enum: [user, assistant, system] }
            content:
              description: |
                Plain string or structured (GPT-style). Structured format:
                { "content_type": "text", "parts": ["segment1", "segment2"] }.
                parts = logical segments (paragraphs, bullets); backend joins with newlines for the prompt.
              oneOf:
                - type: string
                - type: object
                  required: [content_type, parts]
                  properties:
                    content_type: { type: string, enum: [text] }
                    parts: { type: array, items: { type: string }, maxItems: 50 }
          example:
            role: user
            content:
              content_type: text
              parts:
                - "We need to validate the login requirements."
                - "Stakeholders: product owner, dev team."
    responses:
      201:
        description: Created message; if role was user, includes assistant_message and bot (name, avatar, role)
      400:
        description: role and content required; role must be user/assistant/system
      404:
        description: Conversation not found
      500:
        description: Agent (Gemini) error when role is user
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    data = request.get_json()
    if not data or "role" not in data or "content" not in data:
        return jsonify({"error": "role and content are required"}), 400
    role = data["role"].strip().lower()
    if role not in ("user", "assistant", "system"):
        return jsonify({"error": "role must be user, assistant, or system"}), 400
    try:
        content = normalize_user_content(data["content"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if not content:
        return jsonify({"error": "content is empty after normalization"}), 400

    msg = Message(
        conversation_id=conv.id,
        role=role,
        content=content,
    )
    db.session.add(msg)

    if role == "user":
        try:
            reply_text, selected_agent_ids = get_agent_reply(conv.id, content)
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Agent failed: {str(e)}"}), 500
        primary_agent_id = selected_agent_ids[0] if selected_agent_ids else None
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            agent_id=primary_agent_id,
        )
        db.session.add(assistant_msg)

    db.session.commit()

    payload = {"message": _message_with_bot(msg)}
    if role == "user":
        payload["assistant_message"] = _message_with_bot(assistant_msg)
        payload["bot"] = get_conversation_bot(primary_agent_id)
        payload["agents_involved"] = selected_agent_ids or []

        # If user asked for export with a format, save file and return download link
        export_format = detect_export_format(content)
        if export_format and export_format in EXPORT_EXT and reply_text.strip():
            try:
                filename = save_export_to_project(project_id, reply_text, export_format)
                # Relative path; frontend prepends API base for same-origin or proxy
                payload["export_requested"] = {
                    "format": export_format,
                    "download_url": f"/api/v1/projects/{project_id}/exports/{filename}",
                    "filename": filename,
                }
            except Exception:
                pass  # Do not fail the request if export save fails

    return jsonify(payload), 201
