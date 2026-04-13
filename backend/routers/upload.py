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
        raise HTTPException(status_code=400, detail="请上传 PDF 文件")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="空文件")

    text = extract_pdf_text(raw, max_pages=10)
    if len(text) < 50:
        raise HTTPException(
            status_code=400,
            detail="未能从 PDF 前 10 页提取足够文本（可能为扫描件或空白页）",
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
