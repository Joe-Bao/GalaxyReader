# GalaxyReader — Infinite 3D RAG

Monorepo: **Next.js** frontend (3D knowledge graph) + **FastAPI** backend (PDF + Gemini).

## Prerequisites

- Node.js 18+
- Python 3.11+
- [Gemini API key](https://ai.google.dev/)

## Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check: <http://localhost:8000/health>

## Frontend

```bash
cd frontend
cp .env.example .env.local   # optional; default API is http://localhost:8000

npm install
npm run dev
```

Open <http://localhost:3000>: you’ll see the demo `mock-graph.json` “galaxy” first; after uploading a PDF, the backend extracts a graph and the 3D view refreshes; clicking a node opens chat with an auto-generated follow-up question.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | `multipart/form-data`, field `file`; returns `nodes`, `links`, `doc_id` |
| POST | `/api/chat` | JSON: `doc_id`, `question`, optional `node_name`, `node_summary` |

## Environment variables

| Variable | Location | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | `backend/.env` | Required for upload and chat |
| `GEMINI_MODEL` | `backend/.env` | Optional; default `gemini-2.0-flash` |
| `CORS_ORIGINS` | `backend/.env` | Optional; comma-separated; default `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Optional; default `http://localhost:8000` |
