"""RAG-style Q&A over stored document text using Gemini."""

from __future__ import annotations

import os
from pathlib import Path

import google.generativeai as genai

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
MAX_CONTEXT_CHARS = 120_000


def _load_rag_prompt(
    *,
    document_text: str,
    question: str,
    node_name: str | None,
    node_summary: str | None,
) -> str:
    template = (PROMPTS_DIR / "rag_qa.txt").read_text(encoding="utf-8")
    nn = node_name or "（未从图谱指定）"
    ns = node_summary or "（无）"
    doc = document_text[:MAX_CONTEXT_CHARS]
    return (
        template.replace("{document_text}", doc)
        .replace("{question}", question)
        .replace("{node_name}", nn)
        .replace("{node_summary}", ns)
    )


def answer_question(
    *,
    document_text: str,
    question: str,
    node_name: str | None = None,
    node_summary: str | None = None,
) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=api_key)
    prompt = _load_rag_prompt(
        document_text=document_text or "（无文档内容）",
        question=question,
        node_name=node_name,
        node_summary=node_summary,
    )

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=genai.GenerationConfig(temperature=0.3),
    )
    response = model.generate_content(prompt)
    return (response.text or "").strip() or "（模型未返回内容）"
