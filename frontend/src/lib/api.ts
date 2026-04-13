import type {
  ChatRequest,
  ChatResponse,
  DocumentTextResponse,
  GeminiModelsResponse,
  SummarizeRequest,
  SummarizeResponse,
  UploadResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export async function summarizeRelevant(
  body: SummarizeRequest
): Promise<SummarizeResponse> {
  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Summarize failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchDocumentText(
  docId: string
): Promise<DocumentTextResponse> {
  const res = await fetch(`${API_BASE}/api/document/${encodeURIComponent(docId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Document fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchGeminiModels(): Promise<GeminiModelsResponse> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Models list failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadPdf(
  file: File,
  geminiModel?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const m = geminiModel?.trim();
  if (m) formData.append("gemini_model", m);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function sendChat(
  body: ChatRequest
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat failed: ${res.status}`);
  }
  return res.json();
}
