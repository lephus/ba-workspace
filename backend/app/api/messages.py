"""Messages API."""
from flask import Blueprint, jsonify, request

from app.models import Conversation, Message, Project, db
from app.services.conversation_agent import get_agent_reply

bp = Blueprint("messages", __name__)


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
    return jsonify([m.to_dict() for m in msgs])


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
            content: { type: string }
    responses:
      201:
        description: Created message; if role was user, includes assistant_message
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
    content = data["content"]

    msg = Message(
        conversation_id=conv.id,
        role=role,
        content=content,
    )
    db.session.add(msg)

    if role == "user":
        try:
            reply_text = get_agent_reply(conv.id, content)
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Agent failed: {str(e)}"}), 500
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
        )
        db.session.add(assistant_msg)

    db.session.commit()

    payload = {"message": msg.to_dict()}
    if role == "user":
        payload["assistant_message"] = assistant_msg.to_dict()

    return jsonify(payload), 201
