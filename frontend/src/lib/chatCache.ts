/**
 * LRU cache of chat answers in localStorage (doc + model + question).
 * Avoids repeat Gemini calls for identical questions.
 */

const STORAGE_KEY = "galaxyreader_chat_cache_v1";
const MAX_ENTRIES = 150;

type StoreShape = Record<
  string,
  { answer: string; question: string; ts: number }
>;

function fnv1a32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export function cacheKey(
  docId: string | null,
  geminiModel: string,
  question: string,
  nodeHint?: string
): string {
  const scope = docId?.trim() || "__demo__";
  const m = geminiModel.trim() || "default";
  const q = question.trim();
  const hint = (nodeHint || "").trim().slice(0, 200);
  const payload = `${scope}\n${m}\n${q}\n${hint}`;
  return `${scope}::${m}::${fnv1a32(payload)}`;
}

function loadStore(): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoreShape;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota: drop half oldest */
    const entries = Object.entries(store).sort((a, b) => a[1].ts - b[1].ts);
    const half = entries.slice(Math.floor(entries.length / 2));
    const next: StoreShape = Object.fromEntries(half);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* give up */
    }
  }
}

function prune(store: StoreShape): StoreShape {
  const keys = Object.keys(store);
  if (keys.length <= MAX_ENTRIES) return store;
  const sorted = keys.sort((a, b) => store[a].ts - store[b].ts);
  const drop = sorted.slice(0, keys.length - MAX_ENTRIES + 10);
  const next = { ...store };
  for (const k of drop) delete next[k];
  return next;
}

export function getCachedAnswer(
  docId: string | null,
  geminiModel: string,
  question: string,
  nodeHint?: string
): string | null {
  const key = cacheKey(docId, geminiModel, question, nodeHint);
  const store = loadStore();
  const row = store[key];
  if (!row) return null;
  if (row.question.trim() !== question.trim()) return null;
  return row.answer;
}

export function setCachedAnswer(
  docId: string | null,
  geminiModel: string,
  question: string,
  answer: string,
  nodeHint?: string
): void {
  const q = question.trim();
  if (!q || !answer.trim()) return;
  let store = prune(loadStore());
  const key = cacheKey(docId, geminiModel, q, nodeHint);
  store[key] = { answer, question: q, ts: Date.now() };
  store = prune(store);
  saveStore(store);
}
