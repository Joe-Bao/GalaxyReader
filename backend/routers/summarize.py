from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from document_store import DOCUMENT_STORE
from services.summarize_service import summarize_relevant_excerpt

router = APIRouter()


class SummarizeRequest(BaseModel):
    doc_id: str = Field(..., min_length=1)
    node_name: str | None = None
    node_summary: str | None = None
    keywords: list[str] | None = None
    gemini_model: str | None = None


@router.post("/summarize")
async def summarize(body: SummarizeRequest) -> dict:
    text = DOCUMENT_STORE.get(body.doc_id)
    if text is None:
        raise HTTPException(status_code=404, detail="Document not found or expired.")

    try:
        summary = summarize_relevant_excerpt(
            document_text=text,
            node_name=body.node_name,
            node_summary=body.node_summary,
            keywords=body.keywords,
            model_name=body.gemini_model,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return {"summary": summary}
