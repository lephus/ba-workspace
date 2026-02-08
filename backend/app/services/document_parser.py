"""Document parsing service."""
from pathlib import Path

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


def parse_document(file_path: str) -> dict:
    """
    Parse document and extract text and metadata.
    Returns: { document_text: str, document_metadata: dict }
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    suffix = path.suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported format: {suffix}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    metadata = {
        "filename": path.name,
        "type": suffix.lstrip("."),
    }

    if suffix == ".pdf":
        return _parse_pdf(path, metadata)
    if suffix in (".docx", ".doc"):
        return _parse_docx(path, metadata)
    if suffix == ".txt":
        return _parse_txt(path, metadata)

    raise ValueError(f"Unsupported format: {suffix}")


def _parse_pdf(path: Path, metadata: dict) -> dict:
    """Parse PDF using PyPDF2."""
    from PyPDF2 import PdfReader

    reader = PdfReader(str(path))
    pages = reader.pages
    text = "\n".join(p.extract_text() or "" for p in pages)
    metadata["page_count"] = len(pages)
    return {"document_text": text, "document_metadata": metadata}


def _parse_docx(path: Path, metadata: dict) -> dict:
    """Parse Word document using python-docx."""
    from docx import Document as DocxDocument

    doc = DocxDocument(str(path))
    paragraphs = [p.text for p in doc.paragraphs]
    text = "\n".join(paragraphs)
    metadata["paragraph_count"] = len(paragraphs)
    return {"document_text": text, "document_metadata": metadata}


def _parse_txt(path: Path, metadata: dict) -> dict:
    """Parse plain text file."""
    with open(path, encoding="utf-8", errors="replace") as f:
        text = f.read()
    return {"document_text": text, "document_metadata": metadata}
