from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from document_store import DOCUMENT_STORE
from services.rag_service import answer_question

router = APIRouter()


class ChatRequest(BaseModel):
    doc_id: str | None = None
    question: str = Field(..., min_length=1, max_length=8000)
    node_name: str | None = None
    node_summary: str | None = None


@router.post("/chat")
async def chat(body: ChatRequest) -> dict:
    text = ""
    if body.doc_id:
        text = DOCUMENT_STORE.get(body.doc_id, "")

    try:
        answer = answer_question(
            document_text=text,
            question=body.question,
            node_name=body.node_name,
            node_summary=body.node_summary,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return {"answer": answer}
