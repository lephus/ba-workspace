"""Document model."""
import json
from datetime import datetime
from pathlib import Path

from app.models import db


class Document(db.Model):
    """Document entity."""

    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=True)
    filename = db.Column(db.String(512), nullable=False)
    file_path = db.Column(db.String(1024), nullable=False)
    file_type = db.Column(db.String(32), nullable=True)   # e.g. .pdf, .docx
    file_size = db.Column(db.BigInteger, nullable=True)   # size in bytes
    ai_task = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    # RAG fields — populated after AI processing
    summary = db.Column(db.Text, nullable=True)
    keywords = db.Column(db.Text, nullable=True)           # JSON-array string
    important_points = db.Column(db.Text, nullable=True)   # JSON-array string
    assigned_agent = db.Column(db.String(32), nullable=True)
    rag_processed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship("Project", back_populates="documents")
    analyses = db.relationship("Analysis", back_populates="document", cascade="all, delete-orphan")

    def to_dict(self):
        keywords = []
        important_points = []
        try:
            if self.keywords:
                keywords = json.loads(self.keywords)
        except Exception:
            keywords = [self.keywords] if self.keywords else []
        try:
            if self.important_points:
                important_points = json.loads(self.important_points)
        except Exception:
            important_points = [self.important_points] if self.important_points else []
        # Fallback file_type/file_size for docs created before these columns existed
        file_type = self.file_type
        if file_type is None and self.filename:
            file_type = Path(self.filename).suffix.lower() or None
        file_size = self.file_size
        if file_size is None and self.file_path:
            try:
                p = Path(self.file_path)
                if p.is_file():
                    file_size = p.stat().st_size
            except OSError:
                pass
        return {
            "id": self.id,
            "project_id": self.project_id,
            "conversation_id": self.conversation_id,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_type": file_type,
            "file_size": file_size,
            "ai_task": self.ai_task,
            "notes": self.notes,
            "summary": self.summary,
            "keywords": keywords,
            "important_points": important_points,
            "assigned_agent": self.assigned_agent,
            "rag_processed_at": self.rag_processed_at.isoformat() if self.rag_processed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
