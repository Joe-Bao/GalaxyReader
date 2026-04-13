"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  buildHighlightRanges,
  rangesToSegments,
  type PlainSegment,
} from "@/lib/highlightRanges";

interface HighlightedSourceProps {
  body: string;
  keywords: string[];
  /** Usually the node name — tier-2 highlight */
  primaryPhrase: string;
  scrollSignal?: number;
}

const tierClass: Record<PlainSegment["tier"], string> = {
  0: "",
  1: "rounded-sm bg-rose-500/25 text-rose-50 ring-1 ring-rose-400/35",
  2: "rounded-sm bg-red-500/35 text-red-50 ring-1 ring-red-400/45",
};

export function HighlightedSource({
  body,
  keywords,
  primaryPhrase,
  scrollSignal = 0,
}: HighlightedSourceProps) {
  const firstMarkRef = useRef<HTMLSpanElement | null>(null);

  const segments = useMemo(() => {
    const ranges = buildHighlightRanges(body, keywords, primaryPhrase);
    return rangesToSegments(body, ranges);
  }, [body, keywords, primaryPhrase]);

  const firstHighlightIndex = useMemo(
    () => segments.findIndex((s) => s.tier > 0),
    [segments]
  );

  useEffect(() => {
    if (!firstMarkRef.current) return;
    firstMarkRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [scrollSignal, segments]);

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-slate-200/95">
      {segments.map((seg, i) => {
        if (seg.tier === 0) {
          return <span key={i}>{seg.text}</span>;
        }
        return (
          <mark
            key={i}
            ref={i === firstHighlightIndex ? firstMarkRef : undefined}
            className={tierClass[seg.tier]}
          >
            {seg.text}
          </mark>
        );
      })}
    </div>
  );
}
