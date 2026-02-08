"""Projects API."""
from flask import Blueprint, jsonify, request

from app.models import Project, db

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


@bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """
    Delete project
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
    db.session.delete(project)
    db.session.commit()
    return "", 204
