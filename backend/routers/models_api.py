from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services.gemini_models import list_generate_content_models

router = APIRouter()


@router.get("/models")
async def get_gemini_models() -> dict:
    """Return Gemini models that support ``generateContent`` (requires API key)."""
    try:
        models = list_generate_content_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001 — surface SDK/network errors
        raise HTTPException(
            status_code=502,
            detail=f"Failed to list models: {e!s}",
        ) from e

    return {"models": models}
