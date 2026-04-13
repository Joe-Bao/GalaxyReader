from __future__ import annotations

from fastapi import APIRouter, HTTPException

from document_store import DOCUMENT_STORE

router = APIRouter()


@router.get("/document/{doc_id}")
def get_document_text(doc_id: str) -> dict:
    """Return extracted plain text for an uploaded document (demo in-memory store)."""
    text = DOCUMENT_STORE.get(doc_id)
    if text is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")
    return {"text": text}
