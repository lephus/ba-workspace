"""SQLAlchemy models and db instance."""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import after db to register models
from app.models.project import Project  # noqa: E402
from app.models.document import Document  # noqa: E402
from app.models.analysis import Analysis  # noqa: E402

__all__ = ["db", "Project", "Document", "Analysis"]
