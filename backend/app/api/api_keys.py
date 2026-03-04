"""API endpoints for managing Gemini API keys."""
import logging

from flask import Blueprint, jsonify, request

from app.models import db
from app.models.api_key import ApiKey
from app.services.key_manager import get_current_key_info, reset_failures

logger = logging.getLogger(__name__)

bp = Blueprint("api_keys", __name__)


@bp.route("/api-keys", methods=["GET"])
def list_keys():
    """
    List all API keys (env + UI).
    ---
    tags:
      - API Keys
    responses:
      200:
        description: List of API keys with masked values
    """
    import os
    from flask import current_app

    keys = []

    # 1) .env key (always first, read-only)
    env_key = current_app.config.get("GEMINI_API_KEY", "").strip()
    if env_key:
        masked = env_key[:8] + "..." + env_key[-4:] if len(env_key) > 12 else "***"
        keys.append({
            "id": None,
            "key_masked": masked,
            "label": ".env",
            "is_active": True,
            "last_error": None,
            "last_used_at": None,
            "created_at": None,
            "source": "env",
        })

    # 2) UI keys from database
    db_keys = ApiKey.query.order_by(ApiKey.created_at.asc()).all()
    for k in db_keys:
        d = k.to_dict()
        d["source"] = "ui"
        keys.append(d)

    # 3) Annotate which key is currently active
    current = get_current_key_info()
    for k in keys:
        if current and k["key_masked"] == current["key_masked"] and k["source"] == current["source"]:
            k["is_current"] = True
        else:
            k["is_current"] = False

    return jsonify(keys)


@bp.route("/api-keys", methods=["POST"])
def add_key():
    """
    Add a new API key.
    ---
    tags:
      - API Keys
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [key]
          properties:
            key: { type: string }
            label: { type: string }
            validate: { type: boolean }
    responses:
      201:
        description: Key added successfully
      400:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}
    raw_key = (data.get("key") or "").strip()
    label = (data.get("label") or "").strip() or None
    should_validate = data.get("validate", False)

    if not raw_key:
        return jsonify({"error": "API key không được để trống"}), 400

    # Check duplicate
    existing = ApiKey.query.filter_by(key=raw_key).first()
    if existing:
        return jsonify({"error": "API key này đã tồn tại"}), 400

    # Optionally validate before saving
    if should_validate:
        try:
            import google.generativeai as genai
            genai.configure(api_key=raw_key)
            list(genai.list_models())
        except Exception as e:
            err_str = str(e).lower()
            if any(kw in err_str for kw in ("401", "403", "invalid", "api_key_invalid",
                                              "permission_denied", "not valid", "expired")):
                return jsonify({"error": "API key không hợp lệ"}), 400
            # Quota/rate errors mean key is valid but limited
            if "429" not in err_str and "quota" not in err_str and "resource_exhausted" not in err_str:
                return jsonify({"error": f"Không thể xác thực key: {str(e)[:150]}"}), 400

    new_key = ApiKey(key=raw_key, label=label, is_active=True)
    db.session.add(new_key)
    db.session.commit()

    # Reset failure state so the new key can be picked up
    reset_failures()

    result = new_key.to_dict()
    result["source"] = "ui"
    return jsonify(result), 201


@bp.route("/api-keys/<int:key_id>", methods=["DELETE"])
def delete_key(key_id: int):
    """
    Delete an API key.
    ---
    tags:
      - API Keys
    parameters:
      - in: path
        name: key_id
        type: integer
        required: true
    responses:
      200:
        description: Key deleted
      404:
        description: Key not found
    """
    key = ApiKey.query.get(key_id)
    if not key:
        return jsonify({"error": "Không tìm thấy key"}), 404

    db.session.delete(key)
    db.session.commit()
    reset_failures()

    return jsonify({"message": "Đã xoá API key"})


@bp.route("/api-keys/<int:key_id>/toggle", methods=["PATCH"])
def toggle_key(key_id: int):
    """
    Toggle an API key active/inactive.
    ---
    tags:
      - API Keys
    parameters:
      - in: path
        name: key_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            is_active: { type: boolean }
    responses:
      200:
        description: Key toggled
      404:
        description: Key not found
    """
    key = ApiKey.query.get(key_id)
    if not key:
        return jsonify({"error": "Không tìm thấy key"}), 404

    data = request.get_json(silent=True) or {}
    key.is_active = data.get("is_active", not key.is_active)
    if key.is_active:
        key.last_error = None  # clear error when re-enabling
    db.session.commit()
    reset_failures()

    result = key.to_dict()
    result["source"] = "ui"
    return jsonify(result)


@bp.route("/api-keys/validate", methods=["POST"])
def validate_key():
    """
    Validate an API key without saving it.
    ---
    tags:
      - API Keys
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [key]
          properties:
            key: { type: string }
    responses:
      200:
        description: Validation result
    """
    data = request.get_json(silent=True) or {}
    raw_key = (data.get("key") or "").strip()

    if not raw_key:
        return jsonify({"valid": False, "error": "API key không được để trống"})

    try:
        import google.generativeai as genai
        genai.configure(api_key=raw_key)
        list(genai.list_models())
        return jsonify({"valid": True, "error": None})
    except Exception as e:
        err_str = str(e).lower()
        if any(kw in err_str for kw in ("401", "403", "invalid", "api_key_invalid",
                                          "permission_denied", "not valid", "expired")):
            return jsonify({"valid": False, "error": "API key không hợp lệ hoặc đã hết hạn"})
        if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
            return jsonify({"valid": True, "error": "Key hợp lệ nhưng đang bị giới hạn quota"})
        return jsonify({"valid": False, "error": f"Lỗi kết nối: {str(e)[:150]}"})
