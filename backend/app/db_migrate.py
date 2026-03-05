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


def migrate_add_message_agent_id(app):
    """Add agent_id to messages if missing (for existing DBs)."""
    with app.app_context():
        try:
            db.session.execute(text("SELECT agent_id FROM messages LIMIT 1"))
        except Exception:
            try:
                db.session.execute(text("ALTER TABLE messages ADD COLUMN agent_id VARCHAR(32)"))
                db.session.commit()
            except Exception:
                db.session.rollback()


def migrate_add_conversation_pinned_at(app):
    """Add pinned_at to conversations if missing (for existing DBs)."""
    with app.app_context():
        try:
            db.session.execute(text("SELECT pinned_at FROM conversations LIMIT 1"))
        except Exception:
            try:
                db.session.execute(text("ALTER TABLE conversations ADD COLUMN pinned_at DATETIME"))
                db.session.commit()
            except Exception:
                db.session.rollback()


def migrate_add_documents_ai_task(app):
    """Add ai_task to documents if missing (for existing DBs)."""
    with app.app_context():
        try:
            db.session.execute(text("SELECT ai_task FROM documents LIMIT 1"))
        except Exception:
            try:
                db.session.execute(text("ALTER TABLE documents ADD COLUMN ai_task TEXT"))
                db.session.commit()
            except Exception:
                db.session.rollback()


def migrate_add_documents_notes(app):
    """Add notes to documents if missing (for existing DBs)."""
    with app.app_context():
        try:
            db.session.execute(text("SELECT notes FROM documents LIMIT 1"))
        except Exception:
            try:
                db.session.execute(text("ALTER TABLE documents ADD COLUMN notes TEXT"))
                db.session.commit()
            except Exception:
                db.session.rollback()


def migrate_add_documents_rag_fields(app):
    """Add RAG fields to documents if missing (summary, keywords, important_points, assigned_agent, rag_processed_at)."""
    columns = [
        ("summary", "TEXT"),
        ("keywords", "TEXT"),
        ("important_points", "TEXT"),
        ("assigned_agent", "VARCHAR(32)"),
        ("rag_processed_at", "DATETIME"),
    ]
    with app.app_context():
        for column, col_type in columns:
            try:
                db.session.execute(text(f"SELECT {column} FROM documents LIMIT 1"))
            except Exception:
                try:
                    db.session.execute(text(f"ALTER TABLE documents ADD COLUMN {column} {col_type}"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()


def migrate_add_message_attachments(app):
    """Add attachments_json to messages if missing (for existing DBs)."""
    with app.app_context():
        try:
            db.session.execute(text("SELECT attachments_json FROM messages LIMIT 1"))
        except Exception:
            try:
                db.session.execute(text("ALTER TABLE messages ADD COLUMN attachments_json TEXT"))
                db.session.commit()
            except Exception:
                db.session.rollback()


def migrate_add_documents_file_type_size(app):
    """Add file_type and file_size to documents if missing (for existing DBs)."""
    columns = [
        ("file_type", "VARCHAR(32)"),
        ("file_size", "BIGINT"),
    ]
    with app.app_context():
        for column, col_type in columns:
            try:
                db.session.execute(text(f"SELECT {column} FROM documents LIMIT 1"))
            except Exception:
                try:
                    db.session.execute(text(f"ALTER TABLE documents ADD COLUMN {column} {col_type}"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
