"""CMS Dataset model – stores fetched collection data from Payload CMS."""
import json
from datetime import datetime

from app.models import db


class CmsDataset(db.Model):
    """A snapshot of data fetched from a Payload CMS collection."""

    __tablename__ = "cms_datasets"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer, db.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    connection_id = db.Column(
        db.Integer, db.ForeignKey("cms_connections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    collection_slug = db.Column(db.String(255), nullable=False)
    data_json = db.Column(db.Text, nullable=True)
    record_count = db.Column(db.Integer, default=0)
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    project = db.relationship("Project", backref=db.backref("cms_datasets", cascade="all, delete-orphan"))
    connection = db.relationship("CmsConnection", back_populates="datasets")

    def to_dict(self, include_data: bool = False) -> dict:
        d = {
            "id": self.id,
            "project_id": self.project_id,
            "connection_id": self.connection_id,
            "collection_slug": self.collection_slug,
            "record_count": self.record_count,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_data and self.data_json:
            try:
                d["data"] = json.loads(self.data_json)
            except (json.JSONDecodeError, TypeError):
                d["data"] = []
        return d
