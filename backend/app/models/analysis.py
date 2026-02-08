"""Analysis model."""
from datetime import datetime

from app.models import db


class Analysis(db.Model):
    """Analysis result entity."""

    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=False)
    status = db.Column(db.String(32), default="pending")  # pending, running, completed, failed
    agent_results = db.Column(db.JSON, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship("Project", back_populates="analyses")
    document = db.relationship("Document", back_populates="analyses")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "document_id": self.document_id,
            "status": self.status,
            "agent_results": self.agent_results,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
