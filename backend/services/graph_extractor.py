"""Call Gemini to extract knowledge graph JSON from raw text."""

from __future__ import annotations

import json
import os
from pathlib import Path

import google.generativeai as genai

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")


def _load_extract_prompt(text: str) -> str:
    template = (PROMPTS_DIR / "extract_graph.txt").read_text(encoding="utf-8")
    # Avoid str.format() — document may contain braces
    return template.replace("{text}", text[:80000])


def _normalize_graph(raw: dict) -> dict:
    nodes = raw.get("nodes") or []
    links = raw.get("links") or []
    if not isinstance(nodes, list) or not isinstance(links, list):
        raise ValueError("Invalid graph shape")

    id_set: set[str] = set()
    out_nodes: list[dict] = []
    for i, n in enumerate(nodes):
        if not isinstance(n, dict):
            continue
        nid = str(n.get("id") or f"node_{i}")
        name = str(n.get("name") or nid)
        group = str(n.get("group") or "other")
        summary = str(n.get("summary") or "")
        id_set.add(nid)
        out_nodes.append(
            {"id": nid, "name": name, "group": group, "summary": summary}
        )

    out_links: list[dict] = []
    for j, link in enumerate(links):
        if not isinstance(link, dict):
            continue
        src = str(link.get("source", ""))
        tgt = str(link.get("target", ""))
        label = str(link.get("label") or "related")
        if src in id_set and tgt in id_set and src != tgt:
            out_links.append({"source": src, "target": tgt, "label": label})

    return {"nodes": out_nodes, "links": out_links}


def extract_graph_from_text(text: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")

    genai.configure(api_key=api_key)
    prompt = _load_extract_prompt(text)

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    response = model.generate_content(prompt)
    body = response.text or ""
    try:
        data = json.loads(body)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned non-JSON: {body[:500]}") from e

    return _normalize_graph(data)
