"""Migration helper - add new columns to existing tables."""
from sqlalchemy import text

from app.models import db


def migrate_add_conversation_columns(app):
    """Add conversation_id to documents and analyses if missing (for existing DBs)."""
    with app.app_context():
        for table, column in [("documents", "conversation_id"), ("analyses", "conversation_id")]:
            try:
                db.session.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
            except Exception:
                try:
                    db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} INTEGER"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
