# GalaxyReader — Infinite 3D RAG

Monorepo: **Next.js** 前端（3D 知识图谱） + **FastAPI** 后端（PDF + Gemini）。

## 前置条件

- Node.js 18+
- Python 3.11+
- [Gemini API Key](https://ai.google.dev/)

## 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：<http://localhost:8000/health>

## 前端

```bash
cd frontend
cp .env.example .env.local   # 可选，默认已指向 http://localhost:8000

npm install
npm run dev
```

打开 <http://localhost:3000>：先看到演示 `mock-graph.json` 星空；上传 PDF 后由后端抽取图谱并刷新 3D 视图；点击节点会打开聊天并自动提问。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | `multipart/form-data`，字段 `file`，返回 `nodes`, `links`, `doc_id` |
| POST | `/api/chat` | JSON：`doc_id`, `question`, 可选 `node_name`, `node_summary` |

## 环境变量

| 变量 | 位置 | 说明 |
|------|------|------|
| `GEMINI_API_KEY` | `backend/.env` | 必填（上传与对话） |
| `GEMINI_MODEL` | `backend/.env` | 可选，默认 `gemini-2.0-flash` |
| `CORS_ORIGINS` | `backend/.env` | 可选，逗号分隔，默认 `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | 可选，默认 `http://localhost:8000` |
