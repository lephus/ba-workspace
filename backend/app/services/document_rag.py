"""Document RAG (Retrieval-Augmented Generation) pipeline.

After a document is uploaded, this service:
  1. Parses the file to extract plain text.
  2. Calls Claude to produce a structured JSON with summary / keywords /
     important_points / assigned_agent / is_relevant_to_ba.
  3. Persists the results back to the Document record so every future chat
     that references this document can inject the pre-computed context into
     the agent prompt without re-parsing or re-calling the LLM.
"""
import json
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ── Agent catalogue (mirrors conversation_agent router) ──────────────────────
AGENT_CATALOGUE = {
    "emma": "Requirements: user stories, acceptance criteria, functional specs, system requirements",
    "sarah": "Stakeholders: interview notes, feedback, stakeholder register, communication logs",
    "jack": "Process: BPMN diagrams, workflow descriptions, swimlane charts, process maps",
    "david": "Compliance: regulations, business rules, policies, legal constraints, governance",
    "paul": "Traceability: RTM, change logs, test cases, requirement mapping, impact assessment",
    "alex": "General: strategy docs, project charter, meeting notes, or unclear/mixed content",
}

_RAG_SYSTEM_PROMPT = """You are a Business Analysis document intelligence engine.
Your job is to analyse a BA-related document and return a structured JSON object.

Return ONLY a raw JSON object (no markdown fences, no extra explanation) with EXACTLY this schema:
{
  "summary": "<2-4 sentence summary of the document>",
  "keywords": ["keyword1", "keyword2"],
  "important_points": ["point 1", "point 2"],
  "assigned_agent": "<one of: emma | sarah | jack | david | paul | alex>",
  "is_relevant_to_ba": true
}

Agent assignment rules:
- emma   → requirements docs, user stories, acceptance criteria, functional specs
- sarah  → stakeholder feedback, interview notes, stakeholder register, comms logs
- jack   → process flows, BPMN, workflow diagrams, swimlane charts
- david  → compliance, regulations, business rules, legal constraints, policies
- paul   → traceability matrix, RTM, change logs, test cases, requirement mapping
- alex   → general/mixed or unclear category

Set is_relevant_to_ba=false ONLY when the document has nothing to do with business
analysis (e.g. personal invoices, entertainment content, unrelated source code).

Limit keywords to 10. Limit important_points to 5.
"""


def process_document(document_id: int) -> Optional[dict]:
    """
    Run the RAG pipeline for a document: parse → Claude extract → persist to DB.
    Returns the extracted dict on success, None on failure.
    Must be called within a Flask application context.
    """
    from app.models import db
    from app.models.document import Document
    from app.services.document_parser import parse_document
    from app.services.claude_client import generate_content as llm_generate_content

    doc = Document.query.get(document_id)
    if doc is None:
        logger.error("RAG: document %s not found", document_id)
        return None

    # ── 1. Parse file ────────────────────────────────────────────────────────
    try:
        parsed = parse_document(doc.file_path)
        document_text = parsed["document_text"].strip()
    except Exception as exc:
        logger.error("RAG: parse failed for doc %s: %s", document_id, exc)
        return None

    if not document_text:
        logger.warning("RAG: doc %s has no extractable text; skipping", document_id)
        return None

    # Truncate to ~12 000 chars to stay within token limits
    context_text = document_text[:12_000]

    # ── 2. Claude extraction ──────────────────────────────────────────────────
    ai_task_note = f"\n\nAdditional instruction from the user: {doc.ai_task}" if doc.ai_task else ""
    user_prompt = (
        f"Document filename: {doc.filename}\n\n"
        f"Document content:\n{context_text}"
        f"{ai_task_note}"
    )

    try:
        raw = llm_generate_content(_RAG_SYSTEM_PROMPT, user_prompt).strip()
    except Exception as exc:
        logger.error("RAG: Claude call failed for doc %s: %s", document_id, exc)
        return None

    # ── 3. Parse JSON ─────────────────────────────────────────────────────────
    try:
        # Strip accidental markdown code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.lower().startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
    except Exception as exc:
        logger.error("RAG: JSON parse failed for doc %s: %s | raw=%r", document_id, exc, raw[:300])
        return None

    summary = str(data.get("summary", "")).strip()
    keywords = data.get("keywords") or []
    important_points = data.get("important_points") or []
    assigned_agent = str(data.get("assigned_agent", "alex")).lower().strip()
    if assigned_agent not in AGENT_CATALOGUE:
        assigned_agent = "alex"

    # ── 4. Persist to DB ─────────────────────────────────────────────────────
    try:
        doc.summary = summary
        doc.keywords = json.dumps(keywords, ensure_ascii=False)
        doc.important_points = json.dumps(important_points, ensure_ascii=False)
        doc.assigned_agent = assigned_agent
        doc.rag_processed_at = datetime.utcnow()
        db.session.commit()
        logger.info(
            "RAG: processed doc %s → agent=%s keywords=%d points=%d",
            document_id, assigned_agent, len(keywords), len(important_points),
        )
    except Exception as exc:
        db.session.rollback()
        logger.error("RAG: DB persist failed for doc %s: %s", document_id, exc)
        return None

    return {
        "summary": summary,
        "keywords": keywords,
        "important_points": important_points,
        "assigned_agent": assigned_agent,
    }


def build_document_context_block(document) -> str:
    """
    Build the text block injected into the agent's system prompt when the user
    attaches a document to a message.  ``document`` is a Document ORM instance.
    """
    lines = [f"[ATTACHED DOCUMENT: {document.filename}]"]

    if document.summary:
        lines.append(f"Summary: {document.summary}")

    try:
        keywords = json.loads(document.keywords) if document.keywords else []
    except Exception:
        keywords = []
    if keywords:
        lines.append(f"Keywords: {', '.join(keywords)}")

    try:
        points = json.loads(document.important_points) if document.important_points else []
    except Exception:
        points = []
    if points:
        lines.append("Important points:")
        for p in points:
            lines.append(f"  - {p}")

    if document.assigned_agent:
        lines.append(f"Primary agent: {document.assigned_agent}")

    if document.ai_task:
        lines.append(f"User instruction for this document: {document.ai_task}")

    if document.notes:
        lines.append(f"User notes (for reference only): {document.notes}")

    return "\n".join(lines)


def build_project_documents_context(project_id: int) -> Optional[str]:
    """
    Build a compact context block from ALL RAG-processed documents in the project.
    Uses pre-computed summaries/keywords/points so no extra LLM calls are needed.
    Returns None if no documents are available.
    """
    from app.models.document import Document

    docs = (
        Document.query
        .filter_by(project_id=project_id)
        .filter(Document.rag_processed_at.isnot(None))
        .order_by(Document.created_at.asc())
        .all()
    )
    if not docs:
        return None

    blocks = []
    for doc in docs:
        block_lines = [f"📄 {doc.filename}"]
        if doc.summary:
            block_lines.append(f"   Summary: {doc.summary}")
        try:
            kw = json.loads(doc.keywords) if doc.keywords else []
        except Exception:
            kw = []
        if kw:
            block_lines.append(f"   Keywords: {', '.join(kw)}")
        try:
            pts = json.loads(doc.important_points) if doc.important_points else []
        except Exception:
            pts = []
        if pts:
            for p in pts:
                block_lines.append(f"   • {p}")
        if doc.assigned_agent:
            block_lines.append(f"   Agent: {doc.assigned_agent}")
        blocks.append("\n".join(block_lines))

    header = (
        f"[PROJECT DOCUMENTS — {len(docs)} file(s)]\n"
        "The following documents have been uploaded to this project. "
        "Use this knowledge to answer user questions across all conversations in the project.\n"
    )
    return header + "\n\n".join(blocks)
