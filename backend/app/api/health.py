"""Health check API."""
from flask import Blueprint, jsonify
from sqlalchemy import text

from app.models import db

bp = Blueprint("health", __name__)

VERSION = "1.0.0"


@bp.route("/health", methods=["GET"])
def health():
    """Health check endpoint. Returns version and DB status."""
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
