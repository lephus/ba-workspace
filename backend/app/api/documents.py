"""Documents API."""
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request

from app.models import Conversation, Document, Project, db
from app.services.config_loader import get_config
from app.services.document_parser import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_PAGE_COUNT,
    parse_document,
)

bp = Blueprint("documents", __name__)


def _get_documents_path():
    config = get_config()
    return config.get("documents_path", str(Path(current_app.config["PROJECT_ROOT"]) / "data" / "documents"))


@bp.route("/<int:project_id>/documents", methods=["GET"])
def list_documents(project_id):
    """
    List documents for a project
    ---
    tags:
      - Documents
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of documents
      404:
        description: Project not found
    """
    Project.query.get_or_404(project_id)
    docs = Document.query.filter_by(project_id=project_id).order_by(Document.created_at.desc()).all()
    return jsonify([d.to_dict() for d in docs])


@bp.route("/<int:project_id>/documents", methods=["POST"])
def upload_document(project_id):
    """
    Upload a document
    ---
    tags:
      - Documents
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: file
        in: formData
        type: file
        required: true
      - name: conversation_id
        in: formData
        type: integer
        required: false
      - name: ai_task
        in: formData
        type: string
        required: false
        description: Công việc mà AI cần thực hiện với tài liệu này
      - name: notes
        in: formData
        type: string
        required: false
        description: Ghi chú cho tài liệu
    consumes:
      - multipart/form-data
    responses:
      201:
        description: Created document
      400:
        description: No file or unsupported format (pdf, docx, txt)
      404:
        description: Project not found
    """
    project = Project.query.get_or_404(project_id)
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    path = Path(file.filename)
    suffix = path.suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Định dạng không hỗ trợ: {suffix}. Chấp nhận: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    # Read into memory first to validate size before writing to disk
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        size_mb = len(file_bytes) / (1024 * 1024)
        return jsonify({
            "error": f"File vượt quá giới hạn 5MB (kích thước thực tế: {size_mb:.1f}MB)"
        }), 400

    base_path = Path(_get_documents_path())
    project_dir = base_path / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = project_dir / unique_name
    file_path.write_bytes(file_bytes)

    # Validate page count (requires parsing the saved file)
    try:
        parsed = parse_document(str(file_path))
        page_count = parsed["document_metadata"].get("page_count", 1)
        if page_count > MAX_PAGE_COUNT:
            file_path.unlink(missing_ok=True)
            return jsonify({
                "error": f"Tài liệu có {page_count} trang, vượt quá giới hạn {MAX_PAGE_COUNT} trang"
            }), 400
    except Exception as parse_err:
        current_app.logger.warning("Could not check page count for %s: %s", file.filename, parse_err)

    conversation_id = None
    if request.form.get("conversation_id"):
        try:
            cid = int(request.form["conversation_id"])
            conv = Conversation.query.filter_by(id=cid, project_id=project_id).first()
            if conv:
                conversation_id = cid
        except (ValueError, TypeError):
            pass

    ai_task = request.form.get("ai_task") or None
    notes = request.form.get("notes") or None

    doc = Document(
        project_id=project_id,
        conversation_id=conversation_id,
        filename=file.filename,
        file_path=str(file_path),
        ai_task=ai_task,
        notes=notes,
    )
    db.session.add(doc)
    db.session.commit()

    # Trigger RAG pipeline (synchronous — runs in the same request)
    try:
        from app.services.document_rag import process_document
        process_document(doc.id)
        db.session.refresh(doc)
    except Exception as rag_err:
        current_app.logger.warning("RAG pipeline failed for doc %s: %s", doc.id, rag_err)

    return jsonify(doc.to_dict()), 201


@bp.route("/<int:project_id>/documents/<int:document_id>", methods=["DELETE"])
def delete_document(project_id, document_id):
    """
    Delete a document
    ---
    tags:
      - Documents
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: document_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Document deleted
      404:
        description: Project or document not found
    """
    Project.query.get_or_404(project_id)
    doc = Document.query.filter_by(id=document_id, project_id=project_id).first_or_404()

    file_path = Path(doc.file_path)
    if file_path.is_file():
        file_path.unlink(missing_ok=True)

    db.session.delete(doc)
    db.session.commit()
    return "", 204
