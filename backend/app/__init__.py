"""BAWS Flask application factory."""
from flask import Flask
from flask_cors import CORS


def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)

    # Load config (use Config class, not module)
    from app.config import Config

    app.config.from_object(Config)
    if config:
        app.config.update(config)

    # Register blueprints
    from app.api.health import bp as health_bp
    from app.api.projects import bp as projects_bp
    from app.api.documents import bp as documents_bp
    from app.api.analysis import bp as analysis_bp

    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(projects_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(documents_bp, url_prefix="/api/v1/projects")
    app.register_blueprint(analysis_bp, url_prefix="/api/v1")

    # Init DB
    from app.models import db

    db.init_app(app)
    with app.app_context():
        db.create_all()

    return app
