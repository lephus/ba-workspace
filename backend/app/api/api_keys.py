"""API Key management endpoints."""
import logging

from flask import Blueprint, jsonify, request

from app.services.key_manager import (
    add_key,
    get_all_keys,
    remove_key,
    toggle_key,
    validate_key_quick,
    reset_current,
)

logger = logging.getLogger(__name__)

bp = Blueprint("api_keys", __name__)


@bp.route("/settings/api-keys", methods=["GET"])
def list_keys():
    """
    List all configured API keys (masked).
    ---
    tags:
      - Settings
    responses:
      200:
        description: List of API keys (env + UI-added)
    """
    keys = get_all_keys()
    return jsonify(keys)


@bp.route("/settings/api-keys", methods=["POST"])
def add_api_key():
    """
    Add a new Gemini API key.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [key]
          properties:
            key: { type: string }
            label: { type: string }
            validate: { type: boolean, default: true }
    responses:
      201:
        description: Key added
      400:
        description: Validation error
    """
    data = request.get_json()
    if not data or not data.get("key"):
        return jsonify({"error": "API key là bắt buộc"}), 400

    key = data["key"].strip()
    label = (data.get("label") or "").strip() or None
    should_validate = data.get("validate", True)

    # Optionally validate before saving
    if should_validate:
        result = validate_key_quick(key)
        if not result["valid"]:
            return jsonify({"error": result["error"]}), 400

    try:
        api_key = add_key(key, label)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    reset_current()  # force re-evaluation of active key
    return jsonify(api_key), 201


@bp.route("/settings/api-keys/<int:key_id>", methods=["DELETE"])
def delete_api_key(key_id):
    """
    Remove an API key.
    ---
    tags:
      - Settings
    parameters:
      - name: key_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Key not found
    """
    if remove_key(key_id):
        reset_current()
        return "", 204
    return jsonify({"error": "Không tìm thấy key"}), 404


@bp.route("/settings/api-keys/<int:key_id>/toggle", methods=["PATCH"])
def toggle_api_key(key_id):
    """
    Enable or disable an API key.
    ---
    tags:
      - Settings
    parameters:
      - name: key_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [is_active]
          properties:
            is_active: { type: boolean }
    responses:
      200:
        description: Updated key
      404:
        description: Key not found
    """
    data = request.get_json()
    if data is None or "is_active" not in data:
        return jsonify({"error": "is_active là bắt buộc"}), 400

    result = toggle_key(key_id, data["is_active"])
    if result is None:
        return jsonify({"error": "Không tìm thấy key"}), 404

    reset_current()
    return jsonify(result)


@bp.route("/settings/api-keys/validate", methods=["POST"])
def validate_key():
    """
    Validate an API key without saving it.
    ---
    tags:
      - Settings
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [key]
          properties:
            key: { type: string }
    responses:
      200:
        description: Validation result
    """
    data = request.get_json()
    if not data or not data.get("key"):
        return jsonify({"error": "API key là bắt buộc"}), 400

    result = validate_key_quick(data["key"].strip())
    return jsonify(result)
