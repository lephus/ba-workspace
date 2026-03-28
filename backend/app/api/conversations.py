"""Conversations API."""
from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import nulls_last

from app.models import Conversation, Project, db

bp = Blueprint("conversations", __name__)


@bp.route("/<int:project_id>/conversations", methods=["GET"])
def list_conversations(project_id):
    """
    List conversations for a project
    ---
    tags:
      - Conversations
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of conversations
      404:
        description: Project not found
    """
    Project.query.get_or_404(project_id)
    convs = (
        Conversation.query.filter_by(project_id=project_id)
        .order_by(
            nulls_last(Conversation.pinned_at.desc()),
            Conversation.updated_at.desc(),
        )
        .all()
    )
    return jsonify([c.to_dict() for c in convs])


@bp.route("/<int:project_id>/conversations", methods=["POST"])
def create_conversation(project_id):
    """
    Create a new conversation
    ---
    tags:
      - Conversations
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          properties:
            title: { type: string, default: New chat }
    responses:
      201:
        description: Created conversation
      404:
        description: Project not found
    """
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    title = data.get("title", "New chat")
    conv = Conversation(project_id=project_id, title=title.strip() or "New chat")
    db.session.add(conv)
    db.session.commit()
    return jsonify(conv.to_dict()), 201


@bp.route("/<int:project_id>/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation(project_id, conversation_id):
    """
    Get conversation by ID
    ---
    tags:
      - Conversations
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
        description: Conversation details
      404:
        description: Not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    return jsonify(conv.to_dict())


@bp.route("/<int:project_id>/conversations/<int:conversation_id>", methods=["PUT"])
def update_conversation(project_id, conversation_id):
    """
    Update conversation
    ---
    tags:
      - Conversations
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
        schema:
          type: object
          properties:
            title: { type: string }
    responses:
      200:
        description: Updated conversation
      404:
        description: Not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    data = request.get_json() or {}
    if "title" in data:
        conv.title = data["title"].strip() or conv.title
    db.session.commit()
    return jsonify(conv.to_dict())


@bp.route("/<int:project_id>/conversations/<int:conversation_id>/pin", methods=["PUT"])
def pin_conversation(project_id, conversation_id):
    """
    Pin or unpin a conversation (pinned conversations appear at top of list).
    ---
    tags:
      - Conversations
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
        schema:
          type: object
          properties:
            pinned: { type: boolean, default: true }
    responses:
      200:
        description: Updated conversation with pinned state
      404:
        description: Not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    data = request.get_json() or {}
    pinned = data.get("pinned", True)
    conv.pinned_at = datetime.utcnow() if pinned else None
    db.session.commit()
    return jsonify(conv.to_dict())


@bp.route("/<int:project_id>/conversations/<int:conversation_id>/pin", methods=["DELETE"])
def unpin_conversation(project_id, conversation_id):
    """
    Unpin a conversation.
    ---
    tags:
      - Conversations
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
        description: Updated conversation (unpinned)
      404:
        description: Not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    conv.pinned_at = None
    db.session.commit()
    return jsonify(conv.to_dict())


@bp.route("/<int:project_id>/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(project_id, conversation_id):
    """
    Delete conversation
    ---
    tags:
      - Conversations
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
      204:
        description: Deleted
      404:
        description: Not found
    """
    conv = Conversation.query.filter_by(
        id=conversation_id, project_id=project_id
    ).first_or_404()
    db.session.delete(conv)
    db.session.commit()
    return "", 204


@bp.route("/<int:project_id>/conversations/bulk-delete", methods=["POST"])
def bulk_delete_conversations(project_id):
    """
    Bulk delete conversations
    ---
    tags:
      - Conversations
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          required:
            - conversation_ids
          properties:
            conversation_ids:
              type: array
              items: { type: integer }
    responses:
      200:
        description: Deleted count
      400:
        description: Invalid request
      404:
        description: Project not found
    """
    Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    conversation_ids = data.get("conversation_ids", [])

    if not conversation_ids or not isinstance(conversation_ids, list):
        return jsonify({"error": "conversation_ids is required and must be a list"}), 400

    convs = Conversation.query.filter(
        Conversation.id.in_(conversation_ids),
        Conversation.project_id == project_id,
    ).all()

    deleted_count = len(convs)
    for conv in convs:
        db.session.delete(conv)
    db.session.commit()

    return jsonify({"deleted": deleted_count})
