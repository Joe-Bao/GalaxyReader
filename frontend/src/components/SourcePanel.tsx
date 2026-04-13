"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDocumentText } from "@/lib/api";
import { HighlightedSource } from "@/components/HighlightedSource";
import { extractSourceKeywords } from "@/lib/sourceKeywords";
import type { GraphNode } from "@/lib/types";

interface SourcePanelProps {
  docId: string | null;
  focusNode: GraphNode | null;
  summarizeBusy: boolean;
  summarizeError: string | null;
  onSummarizeToChat: () => void | Promise<void>;
}

/**
 * Embedded “Raw” column: extracted PDF text + keyword tint + summarize action
 * (summary is pushed into chat by the parent).
 */
export function SourcePanel({
  docId,
  focusNode,
  summarizeBusy,
  summarizeError,
  onSummarizeToChat,
}: SourcePanelProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [scrollKey, setScrollKey] = useState(0);

  const keywords = useMemo(
    () => extractSourceKeywords(focusNode),
    [focusNode]
  );
  const primaryPhrase = focusNode?.name?.trim() ?? "";

  const load = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    setError(null);
    try {
      const { text: t } = await fetchDocumentText(docId);
      setText(t);
    } catch (e) {
      setText(null);
      setError(e instanceof Error ? e.message : "Failed to load source");
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (!docId) {
      setText(null);
      setError(null);
      return;
    }
    void load();
  }, [docId, load]);

  useEffect(() => {
    setScrollKey((k) => k + 1);
  }, [focusNode?.id, filter, keywords.join("|")]);

  const displayBody = useMemo(() => {
    if (text == null) return "";
    const f = filter.trim();
    if (!f) return text;
    return text
      .split("\n")
      .filter((line) => line.toLowerCase().includes(f.toLowerCase()))
      .join("\n");
  }, [text, filter]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-950/98">
      <header className="shrink-0 space-y-2 border-b border-white/10 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold text-cyan-100">Raw</h2>
          <p className="text-[10px] leading-snug text-white/45">
            Extracted text (first 10 pages). Keywords from the selected graph
            node tint matches; drag column edges to resize all three panels.
          </p>
        </div>
        {docId && focusNode && (
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 10).map((k) => (
              <span
                key={k}
                className="rounded-md border border-rose-400/25 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] text-rose-100/90"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </header>

      {!docId && (
        <p className="shrink-0 p-3 text-xs text-amber-200/90">
          Upload a PDF to load extracted text here.
        </p>
      )}

      {docId && (
        <>
          <div className="shrink-0 space-y-2 border-b border-white/5 px-3 py-2">
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter lines…"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-cyan-400/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void load()}
                className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
              >
                Refresh
              </button>
            </div>
            <button
              type="button"
              onClick={() => void onSummarizeToChat()}
              disabled={summarizeBusy || !focusNode}
              className="w-full rounded-lg border border-violet-400/35 bg-violet-500/15 py-2 text-xs font-medium text-violet-100 hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {summarizeBusy
                ? "Summarizing…"
                : "AI summarize → send to Chat"}
            </button>
            {!focusNode && (
              <p className="text-[10px] text-white/35">
                Select a graph node to anchor the summary.
              </p>
            )}
            {summarizeError ? (
              <p className="text-[10px] text-rose-300/90">{summarizeError}</p>
            ) : null}
            <p className="text-[10px] text-white/35">
              Summary appears in the Chat column for follow-up questions.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading && (
              <p className="text-xs text-cyan-300/80">Loading source…</p>
            )}
            {error && <p className="text-xs text-rose-300/90">{error}</p>}
            {!loading && !error && displayBody && (
              <HighlightedSource
                body={displayBody}
                keywords={keywords}
                primaryPhrase={primaryPhrase}
                scrollSignal={scrollKey}
              />
            )}
            {!loading && !error && !displayBody && (
              <p className="text-xs text-white/40">(no lines match filter)</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
