"use client";

import type { GraphNode } from "@/lib/types";

interface NodePanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodePanel({ node, onClose }: NodePanelProps) {
  if (!node) return null;

  return (
    <aside className="pointer-events-auto absolute left-4 top-20 z-20 w-[min(92vw,22rem)] transition-opacity duration-300 md:top-24">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 text-white shadow-[0_0_40px_rgba(56,189,248,0.15)]">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
              节点
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-tight text-white">
              {node.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80 transition hover:bg-white/15"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
          {node.group}
        </span>
        <p className="mt-4 text-sm leading-relaxed text-slate-200/90">
          {node.summary}
        </p>
      </div>
    </aside>
  );
}
