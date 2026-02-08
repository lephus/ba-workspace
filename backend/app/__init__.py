"""BAWS Flask application factory."""
from flask import Flask
from flask_cors import CORS
from flasgger import Swagger


SWAGGER_TEMPLATE = {
    "info": {
        "title": "BAWS API",
        "description": "Business Analysis Workspace - REST API for projects, conversations, documents and analysis.",
        "version": "1.0.0",
    },
    "basePath": "/api/v1",
    "tags": [
        {"name": "Health", "description": "Health check"},
        {"name": "Projects", "description": "Project CRUD"},
        {"name": "Conversations", "description": "Conversations within a project"},
        {"name": "Messages", "description": "Messages within a conversation"},
        {"name": "Documents", "description": "Document upload and list"},
        {"name": "Analysis", "description": "Run and get analysis results"},
    ],
}


def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)
    Swagger(app, template=SWAGGER_TEMPLATE)

    # Load config (use Config class, not module)
    from app.config import Config

    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Register blueprints
    from app.api.health import bp as health_bp
    from app.api.projects import bp as projects_bp
    from app.api.conversations import bp as conversations_bp
    from app.api.messages import bp as messages_bp
    from app.api.documents import bp as documents_bp
    from app.api.analysis import bp as analysis_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(projects_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(conversations_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(messages_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(documents_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(analysis_bp, url_prefix="/api/v1")

    # Init DB
    from app.models import db

    db.init_app(app)
    with app.app_context():
        db.create_all()
        from app.db_migrate import migrate_add_conversation_columns

        migrate_add_conversation_columns(app)

    return app
