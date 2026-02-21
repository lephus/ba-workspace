"""Projects API."""
from pathlib import Path

from flask import Blueprint, jsonify, request, send_file

from app.models import Project, db
from app.services.config_loader import get_config
from app.services.export_service import EXPORT_MIME, is_export_filename_safe

bp = Blueprint("projects", __name__)


@bp.route("", methods=["GET"])
def list_projects():
    """
    List all projects
    ---
    tags:
      - Projects
    responses:
      200:
        description: List of projects
        schema:
          type: array
          items:
            type: object
            properties:
              id: { type: integer }
              name: { type: string }
              created_at: { type: string }
              updated_at: { type: string }
    """
    projects = Project.query.order_by(Project.updated_at.desc()).all()
    return jsonify([p.to_dict() for p in projects])


@bp.route("", methods=["POST"])
def create_project():
    """
    Create a new project
    ---
    tags:
      - Projects
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name]
          properties:
            name: { type: string }
    responses:
      201:
        description: Created project
      400:
        description: name is required
    """
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "name is required"}), 400

    project = Project(name=data["name"].strip())
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    """
    Get project by ID
    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Project details
      404:
        description: Not found
    """
    project = Project.query.get_or_404(project_id)
    return jsonify(project.to_dict())


@bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    """
    Update project
    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          properties:
            name: { type: string }
    responses:
      200:
        description: Updated project
      400:
        description: Request body required
      404:
        description: Not found
    """
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400
    if "name" in data:
        project.name = data["name"].strip()
    db.session.commit()
    return jsonify(project.to_dict())


def _get_project_documents_path(project_id: int) -> Path:
    config = get_config()
    path = config.get("documents_path")
    if not path:
        from flask import current_app
        path = Path(current_app.config["PROJECT_ROOT"]) / "data" / "documents"
    return Path(path) / str(project_id)


@bp.route("/<int:project_id>/exports/<filename>", methods=["GET"])
def download_export(project_id, filename):
    """
    Download an export file for the project.
    Files are stored in data/documents/<project_id>/ and removed when the project is deleted.
    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: filename
        in: path
        type: string
        required: true
        description: Filename returned in export_requested (e.g. export_20250221_123456_abc1.docx)
    responses:
      200:
        description: File download
      404:
        description: Project or file not found
      400:
        description: Invalid filename
    """
    Project.query.get_or_404(project_id)
    if not is_export_filename_safe(filename):
        return jsonify({"error": "Invalid export filename"}), 400
    folder = _get_project_documents_path(project_id)
    file_path = folder / filename
    if not file_path.is_file():
        return jsonify({"error": "Export file not found"}), 404
    ext = filename.split(".")[-1].lower()
    mimetype = EXPORT_MIME.get(ext, "application/octet-stream")
    return send_file(
        file_path,
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename,
    )


@bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """
    Delete project and its data folder (documents + exports under data/documents/<project_id>).
    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Not found
    """
    project = Project.query.get_or_404(project_id)
    folder = _get_project_documents_path(project_id)
    if folder.is_dir():
        import shutil
        shutil.rmtree(folder, ignore_errors=True)
    db.session.delete(project)
    db.session.commit()
    return "", 204
