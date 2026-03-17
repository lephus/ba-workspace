"""Build Gemini-compatible context from stored CMS datasets.

Injected into the system prompt so the AI can reference CMS data
when answering user questions.
"""
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Maximum records to include per collection to avoid token overflow
_MAX_SAMPLE_RECORDS = 20
# Maximum total characters for the entire CMS context block
_MAX_CONTEXT_CHARS = 8000


def build_cms_context(project_id: int) -> Optional[str]:
    """
    Build a context string summarising all CMS datasets for a project.

    Returns None if there are no datasets.
    """
    from app.models.cms_dataset import CmsDataset

    datasets = (
        CmsDataset.query
        .filter_by(project_id=project_id)
        .order_by(CmsDataset.synced_at.desc())
        .all()
    )
    if not datasets:
        return None

    sections: list[str] = []
    sections.append("--- Dữ liệu CMS (Payload CMS) ---")
    sections.append(
        "Dưới đây là dữ liệu được nhập từ Payload CMS. "
        "Hãy sử dụng dữ liệu này để trả lời câu hỏi của người dùng khi phù hợp.\n"
    )

    total_chars = 0

    for ds in datasets:
        if total_chars >= _MAX_CONTEXT_CHARS:
            sections.append(f"\n... (còn {len(datasets) - datasets.index(ds)} collection khác, bị cắt bớt)")
            break

        header = f"### Collection: {ds.collection_slug} ({ds.record_count} bản ghi, đồng bộ lúc {ds.synced_at})"
        sections.append(header)

        # Parse stored data
        records = []
        if ds.data_json:
            try:
                records = json.loads(ds.data_json)
            except (json.JSONDecodeError, TypeError):
                pass

        if not records:
            sections.append("(không có dữ liệu)")
            continue

        # Include sample records
        sample = records[:_MAX_SAMPLE_RECORDS]
        sample_text = json.dumps(sample, ensure_ascii=False, indent=2, default=str)

        if total_chars + len(sample_text) > _MAX_CONTEXT_CHARS:
            # Truncate to fit
            remaining = _MAX_CONTEXT_CHARS - total_chars
            if remaining > 200:
                sample_text = sample_text[:remaining] + "\n... (dữ liệu bị cắt bớt)"
            else:
                sections.append("(dữ liệu bị cắt bớt do giới hạn context)")
                break

        sections.append(f"Dữ liệu mẫu ({len(sample)}/{len(records)} bản ghi):")
        sections.append(sample_text)
        total_chars += len(header) + len(sample_text)
        sections.append("")

    return "\n".join(sections)
