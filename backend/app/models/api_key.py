"""ApiKey model - stores user-provided Claude (Anthropic) API keys."""
from datetime import datetime

from app.models import db


class ApiKey(db.Model):
    """Stores Claude (Anthropic) API keys added via the UI."""

    __tablename__ = "api_keys"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(256), nullable=False, unique=True)
    label = db.Column(db.String(128), nullable=True)  # optional friendly name
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_error = db.Column(db.Text, nullable=True)
    last_used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        masked = self.key[:8] + "..." + self.key[-4:] if len(self.key) > 12 else "***"
        return {
            "id": self.id,
            "key_masked": masked,
            "label": self.label,
            "is_active": self.is_active,
            "last_error": self.last_error,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
