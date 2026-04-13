"""Gemini: short grounded summary of excerpt relevant to a graph node / keywords."""

from __future__ import annotations

import os
from pathlib import Path

import google.generativeai as genai

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
MAX_CHARS = 48_000


def _resolve_model_name(explicit: str | None) -> str:
    name = (explicit or os.environ.get("GEMINI_MODEL") or "gemini-2.0-flash").strip()
    return name or "gemini-2.0-flash"


def summarize_relevant_excerpt(
    *,
    document_text: str,
    node_name: str | None,
    node_summary: str | None,
    keywords: list[str] | None,
    model_name: str | None = None,
) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")

    template = (PROMPTS_DIR / "summarize_relevant.txt").read_text(encoding="utf-8")
    kw = ", ".join(keywords or []) or "(none)"
    nn = node_name or "(none)"
    ns = node_summary or "(none)"
    doc = (document_text or "")[:MAX_CHARS]
    prompt = (
        template.replace("{document_text}", doc)
        .replace("{node_name}", nn)
        .replace("{node_summary}", ns)
        .replace("{keywords}", kw)
    )

    genai.configure(api_key=api_key)
    resolved = _resolve_model_name(model_name)
    model = genai.GenerativeModel(
        model_name=resolved,
        generation_config=genai.GenerationConfig(temperature=0.25),
    )
    response = model.generate_content(prompt)
    return (response.text or "").strip() or "(model returned no text)"
