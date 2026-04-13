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

Open <http://localhost:3000>: the UI is a **three-column resizable layout** (Raw · Galaxy · Chat) using `react-resizable-panels` — drag the separators to give any column up to roughly two-thirds of the space. **Raw** shows extracted PDF text with keyword highlights from the selected graph node; **AI summarize** sends the summary into **Chat** as messages for follow-up context. Clicking a graph node **prefills** a chat question (press **Send** to call the API). Identical chat questions use a **localStorage cache** to save tokens. Chat renders **Markdown**; use **Reset layout** in the header to restore equal thirds.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | `multipart/form-data`, field `file`; returns `nodes`, `links`, `doc_id` |
| POST | `/api/chat` | JSON: `doc_id`, `question`, optional `node_name`, `node_summary`, optional `gemini_model` |
| GET | `/api/models` | Lists Gemini models that support `generateContent` (uses `GEMINI_API_KEY`) |
| GET | `/api/document/{doc_id}` | Returns `{"text": "..."}` — extracted plain text for that upload (in-memory demo store) |
| POST | `/api/summarize` | JSON: `doc_id`, optional `node_name`, `node_summary`, `keywords`, `gemini_model` — short grounded summary for the reader panel |

Upload accepts optional multipart field **`gemini_model`** to override the server default for graph extraction. Chat accepts optional **`gemini_model`** in JSON for that request. The frontend **Settings** UI stores the choice in `localStorage` and sends it on upload/chat.

## Environment variables

| Variable | Location | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | `backend/.env` | Required for upload and chat |
| `GEMINI_MODEL` | `backend/.env` | Optional server default when the client omits `gemini_model` |
| `CORS_ORIGINS` | `backend/.env` | Optional; comma-separated; default `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Optional; default `http://localhost:8000` |
