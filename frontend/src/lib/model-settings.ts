/** Persisted Gemini model id for upload + chat. */

export const STORAGE_KEY = "galaxyreader_gemini_model";

/** Curated shortcuts (API may rename; use “Fetch models” to see live list). */
export const MODEL_PRESETS: { id: string; label: string }[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (balanced)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite (preview)" },
];

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export function readStoredGeminiModel(): string {
  if (typeof window === "undefined") return DEFAULT_GEMINI_MODEL;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)?.trim();
    return v || DEFAULT_GEMINI_MODEL;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

export function writeStoredGeminiModel(id: string): void {
  try {
    const t = id.trim() || DEFAULT_GEMINI_MODEL;
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
}
