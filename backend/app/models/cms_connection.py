"""CMS Connection model – stores Payload CMS connection config per project."""
from datetime import datetime

from app.models import db


class CmsConnection(db.Model):
    """A connection to an external Payload CMS instance, scoped to a project."""

    __tablename__ = "cms_connections"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer, db.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(255), nullable=False)
    base_url = db.Column(db.String(512), nullable=False)
    api_key = db.Column(db.String(512), nullable=True, default="")
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship("Project", backref=db.backref("cms_connections", cascade="all, delete-orphan"))
    datasets = db.relationship("CmsDataset", back_populates="connection", cascade="all, delete-orphan")

    def to_dict(self, mask_key: bool = True) -> dict:
        key_value = self.api_key
        if mask_key and key_value:
            key_value = key_value[:4] + "****" + key_value[-4:] if len(key_value) > 8 else "****"
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "base_url": self.base_url,
            "api_key_masked": key_value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
