"use client";

import type { GraphNode } from "@/lib/types";

interface NodePanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodePanel({ node, onClose }: NodePanelProps) {
  if (!node) return null;

  return (
    <aside className="pointer-events-auto absolute left-3 top-3 z-10 w-[min(calc(100%-1.5rem),20rem)] md:left-4 md:top-4">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 text-white shadow-[0_0_40px_rgba(56,189,248,0.15)]">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
              Node
            </p>
            <h2 className="mt-0.5 text-base font-semibold leading-tight text-white">
              {node.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80 transition hover:bg-white/15"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-medium text-cyan-200">
          {node.group}
        </span>
        <p className="mt-3 text-xs leading-relaxed text-slate-200/90">
          {node.summary}
        </p>
      </div>
    </aside>
  );
}
