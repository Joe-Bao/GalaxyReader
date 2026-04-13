from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from document_store import DOCUMENT_STORE
from services.graph_extractor import extract_graph_from_text
from services.pdf_parser import extract_pdf_text

router = APIRouter()


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")

    text = extract_pdf_text(raw, max_pages=10)
    if len(text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough text from the first 10 pages "
            "(scanned PDFs or blank pages may cause this).",
        )

    try:
        graph = extract_graph_from_text(text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    doc_id = str(uuid.uuid4())
    DOCUMENT_STORE[doc_id] = text

    return {
        "nodes": graph["nodes"],
        "links": graph["links"],
        "doc_id": doc_id,
    }
