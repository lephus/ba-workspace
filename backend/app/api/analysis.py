"""Analysis API."""
from flask import Blueprint, jsonify, request

from app.models import Analysis, Document, Project, db
from app.services.orchestrator import run_analysis, save_analysis_output

bp = Blueprint("analysis", __name__)


@bp.route("/projects/<int:project_id>/analyze", methods=["POST"])
def trigger_analysis(project_id):
    """Trigger analysis for a document in a project."""
    project = Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    document_id = data.get("document_id")
    if not document_id:
        return jsonify({"error": "document_id is required"}), 400

    doc = Document.query.filter_by(id=document_id, project_id=project_id).first_or_404()

    analysis = Analysis(
        project_id=project_id,
        document_id=document_id,
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
    """Get analysis result by ID."""
    analysis = Analysis.query.get_or_404(analysis_id)
    return jsonify(analysis.to_dict())
