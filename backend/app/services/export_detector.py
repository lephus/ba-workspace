"""
Detect from user message whether they requested an export and which format.
Used by messages API to add export_requested with download_url when applicable.
"""
import re

# Map keywords to format (lowercase). Order matters: more specific first.
FORMAT_PATTERNS = [
    (r"\b(word|docx|doc\s*file)\b", "docx"),
    (r"\b(excel|xlsx)\b", "xlsx"),
    (r"\b(pdf)\b", "pdf"),
    (r"\b(markdown|md)\b", "md"),
]
EXPORT_INTENT_PATTERNS = [
    r"xuất\s*(ra|file|cho)?",
    r"export",
    r"tải\s*(về|file)?",
    r"cho\s*tôi\s*file",
    r"download",
    r"lưu\s*(ra|thành)\s*file",
]


def detect_export_format(user_content: str) -> str | None:
    """
    If user message indicates they want to export and specified a format, return that format.
    Otherwise return None. user_content should be plain text (normalized).
    """
    if not user_content or not user_content.strip():
        return None
    text = user_content.lower().strip()
    has_export_intent = any(re.search(p, text, re.IGNORECASE) for p in EXPORT_INTENT_PATTERNS)
    if not has_export_intent:
        return None
    for pattern, fmt in FORMAT_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return fmt
    return None
