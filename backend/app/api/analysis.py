"""Analysis API."""
from flask import Blueprint, jsonify, request

from app.models import Analysis, Document, Project, db
from app.services.orchestrator import run_analysis, save_analysis_output

bp = Blueprint("analysis", __name__)


@bp.route("/projects/<int:project_id>/analyze", methods=["POST"])
def trigger_analysis(project_id):
    """
    Run analysis on a document
    ---
    tags:
      - Analysis
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [document_id]
          properties:
            document_id: { type: integer }
            conversation_id: { type: integer }
    responses:
      201:
        description: Analysis started and result
      400:
        description: document_id is required
      404:
        description: Project or document not found
      500:
        description: Analysis failed
    """
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    document_id = data.get("document_id")
    if not document_id:
        return jsonify({"error": "document_id is required"}), 400

    doc = Document.query.filter_by(id=document_id, project_id=project_id).first_or_404()

    conversation_id = data.get("conversation_id")
    if conversation_id is not None:
        from app.models import Conversation

        conv = Conversation.query.filter_by(
            id=conversation_id, project_id=project_id
        ).first()
        if not conv:
            conversation_id = None
    else:
        conversation_id = None

    analysis = Analysis(
        project_id=project_id,
        document_id=document_id,
        conversation_id=conversation_id,
        status="running",
    )
    db.session.add(analysis)
    db.session.commit()

    try:
        result = run_analysis(doc.file_path, project_id)
        if "error" in result:
            analysis.status = "failed"
            analysis.error_message = result["error"]
            analysis.agent_results = None
        else:
            analysis.status = "completed"
            analysis.agent_results = result.get("agent_results", result)
            analysis.error_message = None
            save_analysis_output(project_id, analysis.id, result)
        db.session.commit()
    except Exception as e:
        analysis.status = "failed"
        analysis.error_message = str(e)
        analysis.agent_results = None
        db.session.commit()
        return jsonify({"error": str(e)}), 500

    return jsonify(analysis.to_dict()), 201


@bp.route("/analyses/<int:analysis_id>", methods=["GET"])
def get_analysis(analysis_id):
    """
    Get analysis result by ID
    ---
    tags:
      - Analysis
    parameters:
      - name: analysis_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Analysis result
      404:
        description: Not found
    """
    analysis = Analysis.query.get_or_404(analysis_id)
    return jsonify(analysis.to_dict())
