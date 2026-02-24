"""Messages API."""
import json
from flask import Blueprint, jsonify, request

from app.models import Conversation, Document, Message, PinnedMessage, Project, db
from app.services.content_normalizer import normalize_user_content
from app.services.conversation_agent import get_agent_reply, get_conversation_bot
from app.services.export_detector import detect_export_format
from app.services.export_service import EXPORT_EXT, save_export_to_project
from app.services.gemini_client import GeminiRateLimitError, GeminiAuthError
from app.services.rate_limiter import get_status as get_rate_limit_status

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


@bp.route("/<int:project_id>/conversations/<int:conversation_id>/pinned-messages", methods=["GET"])
def list_pinned_messages(project_id, conversation_id):
    """
    List pinned messages in a conversation.
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
        description: List of pinned messages (id, message_id, message_preview, pinned_at)
      404:
        description: Conversation not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    pinned = (
        PinnedMessage.query.filter_by(conversation_id=conv.id)
        .order_by(PinnedMessage.pinned_at.desc())
        .all()
    )
    return jsonify([p.to_dict() for p in pinned])


@bp.route(
    "/<int:project_id>/conversations/<int:conversation_id>/messages/<int:message_id>/pin",
    methods=["POST"],
)
def pin_message(project_id, conversation_id, message_id):
    """
    Pin a message (stores message_id and first ~100 chars of content).
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
      - name: message_id
        in: path
        type: integer
        required: true
    responses:
      201:
        description: Pinned message created
      404:
        description: Conversation or message not found
      409:
        description: Message already pinned
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    msg = Message.query.filter_by(
        id=message_id, conversation_id=conv.id
    ).first_or_404()
    existing = PinnedMessage.query.filter_by(message_id=message_id).first()
    if existing:
        return jsonify({"error": "Message already pinned"}), 409
    preview = (msg.content or "")[:100].strip()
    if len(preview) > 150:
        preview = preview[:150]
    pinned = PinnedMessage(
        message_id=msg.id,
        conversation_id=conv.id,
        message_preview=preview,
    )
    db.session.add(pinned)
    db.session.commit()
    return jsonify(pinned.to_dict()), 201


@bp.route(
    "/<int:project_id>/conversations/<int:conversation_id>/messages/<int:message_id>/pin",
    methods=["DELETE"],
)
def unpin_message(project_id, conversation_id, message_id):
    """
    Unpin a message.
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
      - name: message_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Unpinned
      404:
        description: Conversation or message or pin not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    pinned = PinnedMessage.query.filter_by(
        message_id=message_id, conversation_id=conv.id
    ).first_or_404()
    db.session.delete(pinned)
    db.session.commit()
    return "", 204


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

    # ── Build document context from attachments ──────────────────────────────
    attachments = data.get("attachments") or []
    document_context_blocks: list[str] = []
    for att in attachments:
        if att.get("type") == "document" and att.get("id"):
            doc = Document.query.filter_by(id=att["id"], project_id=project_id).first()
            if doc:
                # If RAG not yet processed, run pipeline now (lazy fallback)
                if not doc.rag_processed_at:
                    try:
                        from app.services.document_rag import process_document
                        process_document(doc.id)
                        db.session.refresh(doc)
                    except Exception:
                        pass
                from app.services.document_rag import build_document_context_block
                document_context_blocks.append(build_document_context_block(doc))

    # Inject document context into the content sent to the agent
    # (the original user message saved to DB stays clean)
    agent_content = content
    if document_context_blocks:
        context_section = "\n\n".join(document_context_blocks)
        agent_content = (
            f"{content}\n\n"
            f"--- Tài liệu đính kèm ---\n{context_section}"
        )

    msg = Message(
        conversation_id=conv.id,
        role=role,
        content=content,
        attachments_json=json.dumps(attachments) if attachments else None,
    )
    db.session.add(msg)

    if role == "user":
        try:
            reply_text, selected_agent_ids = get_agent_reply(conv.id, agent_content)
        except GeminiRateLimitError as e:
            db.session.rollback()
            status = get_rate_limit_status()
            return jsonify({"error": str(e), "rate_limit": status}), 429
        except GeminiAuthError as e:
            db.session.rollback()
            status = get_rate_limit_status()
            return jsonify({"error": str(e), "rate_limit": status}), 401
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
