"""Extract plain text from PDF bytes (first N pages)."""

from __future__ import annotations

import fitz  # PyMuPDF


def extract_pdf_text(pdf_bytes: bytes, *, max_pages: int = 10) -> str:
    """Return concatenated text from the first ``max_pages`` pages."""
    if not pdf_bytes:
        return ""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        parts: list[str] = []
        n = min(len(doc), max_pages)
        for i in range(n):
            page = doc.load_page(i)
            parts.append(page.get_text("text") or "")
        return "\n\n".join(parts).strip()
    finally:
        doc.close()
