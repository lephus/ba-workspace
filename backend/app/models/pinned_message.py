"""PinnedMessage model - stores pinned messages with message_id and first ~100 chars preview."""
from datetime import datetime

from app.models import db


class PinnedMessage(db.Model):
    """Pinned message: message_id + first ~100 chars of content for display."""

    __tablename__ = "pinned_messages"

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(
        db.Integer,
        db.ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    message_preview = db.Column(db.String(150), nullable=False)
    pinned_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    message = db.relationship("Message", backref=db.backref("pinned_message", uselist=False))
    conversation = db.relationship("Conversation", back_populates="pinned_messages")

    def to_dict(self):
        return {
            "id": self.id,
            "message_id": self.message_id,
            "conversation_id": self.conversation_id,
            "message_preview": self.message_preview,
            "pinned_at": self.pinned_at.isoformat() if self.pinned_at else None,
        }
