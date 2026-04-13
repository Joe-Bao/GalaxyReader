from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat, document, models_api, summarize, upload

# Load .env from backend directory
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="GalaxyReader API", version="0.1.0")

_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
allow_origins = [o.strip() for o in _origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(models_api.router, prefix="/api")
app.include_router(document.router, prefix="/api")
app.include_router(summarize.router, prefix="/api")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
