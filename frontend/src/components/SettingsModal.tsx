"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGeminiModels } from "@/lib/api";
import type { GeminiModelInfo } from "@/lib/types";
import { DEFAULT_GEMINI_MODEL, MODEL_PRESETS } from "@/lib/model-settings";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  geminiModel: string;
  onApply: (modelId: string) => void;
}

export function SettingsModal({
  open,
  onClose,
  geminiModel,
  onApply,
}: SettingsModalProps) {
  const [draft, setDraft] = useState(geminiModel);
  const [remote, setRemote] = useState<GeminiModelInfo[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setDraft(geminiModel);
  }, [open, geminiModel]);

  const handleFetchModels = useCallback(async () => {
    setFetchError(null);
    setFetching(true);
    try {
      const { models } = await fetchGeminiModels();
      setRemote(models);
    } catch (e) {
      setRemote([]);
      setFetchError(e instanceof Error ? e.message : "Failed to load models");
    } finally {
      setFetching(false);
    }
  }, []);

  if (!open) return null;

  const apply = () => {
    const id = draft.trim() || DEFAULT_GEMINI_MODEL;
    onApply(id);
    onClose();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950/95 p-6 text-white shadow-[0_0_48px_rgba(34,211,238,0.12)]"
        role="dialog"
        aria-labelledby="settings-title"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id="settings-title" className="text-lg font-semibold text-cyan-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wide text-white/50">
          Gemini model
        </label>
        <p className="mt-1 text-xs text-white/40">
          Used for PDF graph extraction and chat. Backend still needs{" "}
          <code className="text-cyan-300/90">GEMINI_API_KEY</code>.
        </p>

        <select
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
          value={MODEL_PRESETS.some((p) => p.id === draft) ? draft : "__custom__"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__custom__") return;
            setDraft(v);
          }}
        >
          {MODEL_PRESETS.map((p) => (
            <option key={p.id} value={p.id} className="bg-zinc-900">
              {p.label}
            </option>
          ))}
          <option value="__custom__" className="bg-zinc-900">
            Custom id…
          </option>
        </select>

        <input
          type="text"
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
          placeholder={DEFAULT_GEMINI_MODEL}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleFetchModels()}
            disabled={fetching}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {fetching ? "Fetching…" : "Fetch models from API"}
          </button>
        </div>
        {fetchError && (
          <p className="mt-2 text-xs text-rose-300/90">{fetchError}</p>
        )}

        {remote.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40">
            <ul className="divide-y divide-white/5 text-sm">
              {remote.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-white/5"
                    onClick={() => setDraft(m.id)}
                  >
                    <span className="font-medium text-cyan-100/95">{m.display_name}</span>
                    <span className="font-mono text-[11px] text-white/45">{m.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-xl bg-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-50 hover:bg-cyan-500/40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
