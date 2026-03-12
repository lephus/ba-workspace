"""Health check API."""
from flask import Blueprint, jsonify
from sqlalchemy import text

from app.models import db
from app.services.claude_client import validate_api_key
from app.services.rate_limiter import get_status as get_rate_limit_status

bp = Blueprint("health", __name__)

VERSION = "1.0.0"


@bp.route("/health", methods=["GET"])
def health():
    """
    Health check
    ---
    tags:
      - Health
    responses:
      200:
        description: Service status and DB connection
        schema:
          type: object
          properties:
            status: { type: string, example: ok }
            version: { type: string }
            database: { type: string }
    """
    db_ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return jsonify({
        "status": "ok",
        "version": VERSION,
        "database": "connected" if db_ok else "disconnected",
    })


@bp.route("/rate-limit", methods=["GET"])
def rate_limit():
    """
    Claude API rate-limit and key status.
    ---
    tags:
      - Health
    responses:
      200:
        description: Rate-limit info including key validity and quota status
    """
    from app.services.key_manager import get_current_key_info

    key_info = validate_api_key()
    status = get_rate_limit_status()
    status["key_valid"] = key_info["valid"]
    status["key_error"] = key_info["error"]
    status["current_key"] = get_current_key_info()
    return jsonify(status)
