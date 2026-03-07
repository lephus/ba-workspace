"""
Detect from user message whether they requested an export and which format.
Also detects which BA template type the user wants (BRD, FRD, Backlog, Charter).
Used by messages API to add export_requested with download_url when applicable.
"""
import re
from typing import Optional

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
    r"tạo\s*(file|tài\s*liệu)",
    r"generate\s*(file|document)",
]

# Template type patterns: more specific patterns first to avoid false matches.
TEMPLATE_PATTERNS = [
    (r"\b(brd)\b", "brd"),
    (r"business\s*requirements?\s*document", "brd"),
    (r"tài\s*liệu\s*yêu\s*cầu\s*nghiệp\s*vụ", "brd"),
    (r"yêu\s*cầu\s*nghiệp\s*vụ", "brd"),
    (r"\b(frd)\b", "frd"),
    (r"functional\s*requirements?\s*document", "frd"),
    (r"tài\s*liệu\s*yêu\s*cầu\s*chức\s*năng", "frd"),
    (r"yêu\s*cầu\s*chức\s*năng", "frd"),
    (r"product\s*backlog", "backlog"),
    (r"\bbacklog\b", "backlog"),
    (r"danh\s*mục\s*yêu\s*cầu", "backlog"),
    (r"requirements?\s*register", "backlog"),
    (r"project\s*charter", "charter"),
    (r"\bcharter\b", "charter"),
    (r"điều\s*lệ\s*dự\s*án", "charter"),
]


def detect_export_format(user_content: str) -> Optional[str]:
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


def detect_template_type(user_content: str) -> str | None:
    """
    Detect which BA template type the user wants to export.
    Returns one of: "brd", "frd", "backlog", "charter", or None.
    Only triggers when there's also an export intent in the message.
    """
    if not user_content or not user_content.strip():
        return None
    text = user_content.lower().strip()

    has_export_intent = any(re.search(p, text, re.IGNORECASE) for p in EXPORT_INTENT_PATTERNS)
    if not has_export_intent:
        return None

    for pattern, tpl_type in TEMPLATE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return tpl_type
    return None
