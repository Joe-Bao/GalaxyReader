"""List Gemini models that support generateContent (via google-generativeai)."""

from __future__ import annotations

import os
from typing import Any

import google.generativeai as genai


def normalize_model_id(api_name: str) -> str:
    """Strip ``models/`` prefix for use with GenerativeModel."""
    name = (api_name or "").strip()
    if name.startswith("models/"):
        return name[len("models/") :]
    return name


def list_generate_content_models() -> list[dict[str, Any]]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=api_key)
    out: list[dict[str, Any]] = []
    for m in genai.list_models():
        methods = getattr(m, "supported_generation_methods", None) or []
        if "generateContent" not in methods:
            continue
        raw_name = getattr(m, "name", "") or ""
        out.append(
            {
                "id": normalize_model_id(raw_name),
                "name": raw_name,
                "display_name": getattr(m, "display_name", None) or normalize_model_id(raw_name),
                "description": getattr(m, "description", None) or "",
            }
        )
    # Stable sort: display name then id
    out.sort(key=lambda x: (x["display_name"].lower(), x["id"]))
    return out
