"""CMS Integration API – connect to Payload CMS, browse collections, sync data."""
import json
import logging

from flask import Blueprint, jsonify, request

from app.models import db
from app.models.cms_connection import CmsConnection
from app.models.cms_dataset import CmsDataset
from app.services.payload_cms_client import PayloadCMSClient, PayloadCMSAuthError, PayloadCMSError

logger = logging.getLogger(__name__)

bp = Blueprint("cms", __name__)


# ── Connections ──────────────────────────────────────────────────────────

@bp.route("/<int:project_id>/cms/connections", methods=["GET"])
def list_connections(project_id):
    """
    List CMS connections for a project.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of CMS connections
    """
    conns = (
        CmsConnection.query
        .filter_by(project_id=project_id)
        .order_by(CmsConnection.created_at.desc())
        .all()
    )
    return jsonify([c.to_dict() for c in conns])


@bp.route("/<int:project_id>/cms/connections", methods=["POST"])
def create_connection(project_id):
    """
    Create a new CMS connection.
    ---
    tags:
      - CMS
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
          required: [name, base_url]
          properties:
            name: { type: string }
            base_url: { type: string }
            api_key: { type: string, description: "Optional API key or Bearer token" }
    responses:
      201:
        description: Created connection
      400:
        description: Missing required fields
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    name = (data.get("name") or "").strip()
    base_url = (data.get("base_url") or "").strip().rstrip("/")
    api_key = (data.get("api_key") or "").strip()

    if not name or not base_url:
        return jsonify({"error": "name and base_url are required"}), 400

    conn = CmsConnection(
        project_id=project_id,
        name=name,
        base_url=base_url,
        api_key=api_key,
    )
    db.session.add(conn)
    db.session.commit()
    return jsonify(conn.to_dict()), 201


@bp.route("/<int:project_id>/cms/connections/<int:connection_id>", methods=["PUT"])
def update_connection(project_id, connection_id):
    """
    Update a CMS connection.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: connection_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          type: object
          properties:
            name: { type: string }
            base_url: { type: string }
            api_key: { type: string }
            is_active: { type: boolean }
    responses:
      200:
        description: Updated connection
      404:
        description: Not found
    """
    conn = CmsConnection.query.filter_by(id=connection_id, project_id=project_id).first_or_404()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    if "name" in data:
        conn.name = data["name"].strip()
    if "base_url" in data:
        conn.base_url = data["base_url"].strip().rstrip("/")
    if "api_key" in data:
        conn.api_key = data["api_key"].strip()
    if "is_active" in data:
        conn.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify(conn.to_dict())


@bp.route("/<int:project_id>/cms/connections/<int:connection_id>", methods=["DELETE"])
def delete_connection(project_id, connection_id):
    """
    Delete a CMS connection and its datasets.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: connection_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Not found
    """
    conn = CmsConnection.query.filter_by(id=connection_id, project_id=project_id).first_or_404()
    db.session.delete(conn)
    db.session.commit()
    return "", 204


@bp.route("/<int:project_id>/cms/connections/test-preview", methods=["POST"])
def test_connection_preview(project_id):
    """
    Test a CMS connection before creating it (no DB record needed).
    ---
    tags:
      - CMS
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
          required: [base_url]
          properties:
            base_url: { type: string }
            api_key: { type: string, description: "Optional API key" }
    responses:
      200:
        description: Connection test result { ok, error? }
      400:
        description: Missing base_url
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    base_url = (data.get("base_url") or "").strip().rstrip("/")
    api_key = (data.get("api_key") or "").strip()

    if not base_url:
        return jsonify({"error": "base_url is required"}), 400

    client = PayloadCMSClient(base_url, api_key)
    result = client.test_connection()
    return jsonify(result)


@bp.route("/<int:project_id>/cms/connections/<int:connection_id>/test", methods=["POST"])
def test_connection(project_id, connection_id):
    """
    Test connectivity to the CMS.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: connection_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Connection test result { ok, error? }
      404:
        description: Not found
    """
    conn = CmsConnection.query.filter_by(id=connection_id, project_id=project_id).first_or_404()
    client = PayloadCMSClient(conn.base_url, conn.api_key)
    result = client.test_connection()
    return jsonify(result)


@bp.route("/<int:project_id>/cms/connections/<int:connection_id>/collections", methods=["GET"])
def list_remote_collections(project_id, connection_id):
    """
    List available collections from the remote CMS.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: connection_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of available collections
      404:
        description: Connection not found
      502:
        description: CMS communication error
    """
    conn = CmsConnection.query.filter_by(id=connection_id, project_id=project_id).first_or_404()
    client = PayloadCMSClient(conn.base_url, conn.api_key)
    try:
        collections = client.list_collections()
    except PayloadCMSAuthError as exc:
        return jsonify({"error": str(exc)}), 401
    except PayloadCMSError as exc:
        return jsonify({"error": str(exc)}), 502
    return jsonify(collections)


@bp.route("/<int:project_id>/cms/connections/<int:connection_id>/sync", methods=["POST"])
def sync_collection(project_id, connection_id):
    """
    Fetch data from a collection and store as a dataset.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: connection_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [collection_slug]
          properties:
            collection_slug: { type: string }
            limit: { type: integer, default: 100 }
    responses:
      200:
        description: Synced dataset
      400:
        description: collection_slug required
      404:
        description: Connection not found
      502:
        description: CMS communication error
    """
    conn = CmsConnection.query.filter_by(id=connection_id, project_id=project_id).first_or_404()
    data = request.get_json()
    if not data or not data.get("collection_slug"):
        return jsonify({"error": "collection_slug is required"}), 400

    slug = data["collection_slug"].strip()
    limit = data.get("limit", 100)

    client = PayloadCMSClient(conn.base_url, conn.api_key)
    try:
        result = client.fetch_collection(slug, limit=limit)
    except PayloadCMSAuthError as exc:
        return jsonify({"error": str(exc)}), 401
    except PayloadCMSError as exc:
        return jsonify({"error": str(exc)}), 502

    docs = result.get("docs", [])

    # Upsert: update existing dataset for same connection + slug, or create new
    existing = CmsDataset.query.filter_by(
        project_id=project_id,
        connection_id=connection_id,
        collection_slug=slug,
    ).first()

    from datetime import datetime

    if existing:
        existing.data_json = json.dumps(docs, ensure_ascii=False, default=str)
        existing.record_count = len(docs)
        existing.synced_at = datetime.utcnow()
        dataset = existing
    else:
        dataset = CmsDataset(
            project_id=project_id,
            connection_id=connection_id,
            collection_slug=slug,
            data_json=json.dumps(docs, ensure_ascii=False, default=str),
            record_count=len(docs),
        )
        db.session.add(dataset)

    db.session.commit()
    return jsonify(dataset.to_dict(include_data=False))


# ── Datasets ─────────────────────────────────────────────────────────────

@bp.route("/<int:project_id>/cms/datasets", methods=["GET"])
def list_datasets(project_id):
    """
    List all imported CMS datasets for a project.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of datasets (without full data)
    """
    datasets = (
        CmsDataset.query
        .filter_by(project_id=project_id)
        .order_by(CmsDataset.synced_at.desc())
        .all()
    )
    return jsonify([ds.to_dict(include_data=False) for ds in datasets])


@bp.route("/<int:project_id>/cms/datasets/<int:dataset_id>", methods=["GET"])
def get_dataset(project_id, dataset_id):
    """
    Get a single dataset with its full data.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: dataset_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Dataset with data
      404:
        description: Not found
    """
    ds = CmsDataset.query.filter_by(id=dataset_id, project_id=project_id).first_or_404()
    return jsonify(ds.to_dict(include_data=True))


@bp.route("/<int:project_id>/cms/datasets/<int:dataset_id>", methods=["DELETE"])
def delete_dataset(project_id, dataset_id):
    """
    Delete a dataset.
    ---
    tags:
      - CMS
    parameters:
      - name: project_id
        in: path
        type: integer
        required: true
      - name: dataset_id
        in: path
        type: integer
        required: true
    responses:
      204:
        description: Deleted
      404:
        description: Not found
    """
    ds = CmsDataset.query.filter_by(id=dataset_id, project_id=project_id).first_or_404()
    db.session.delete(ds)
    db.session.commit()
    return "", 204
