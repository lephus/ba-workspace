"""SQLAlchemy models and db instance."""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import after db to register models (order matters for FK: Conversation before Document/Analysis)
from app.models.project import Project  # noqa: E402
from app.models.conversation import Conversation  # noqa: E402
from app.models.message import Message  # noqa: E402
from app.models.document import Document  # noqa: E402
from app.models.analysis import Analysis  # noqa: E402

__all__ = ["db", "Project", "Conversation", "Message", "Document", "Analysis"]
