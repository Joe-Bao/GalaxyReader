import { escapeRegExp } from "@/lib/formatGeminiOutput";

export type HighlightTier = 1 | 2;

export interface TextRange {
  start: number;
  end: number;
  tier: HighlightTier;
}

/**
 * Greedy longest-first keyword matches; longer / primary wins overlaps.
 */
export function buildHighlightRanges(
  text: string,
  keywords: string[],
  primaryPhrase: string
): TextRange[] {
  const seen = new Set<string>();
  const sorted = [...keywords]
    .map((k) => k.trim())
    .filter((k) => k.length >= 2)
    .filter((k) => {
      const key = k.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.length - a.length);

  const ranges: TextRange[] = [];

  function overlaps(s: number, e: number): boolean {
    for (const r of ranges) {
      if (s < r.end && e > r.start) return true;
    }
    return false;
  }

  const primary = primaryPhrase.trim();
  for (const kw of sorted) {
    const tier: HighlightTier =
      primary.length > 0 && kw.toLowerCase() === primary.toLowerCase() ? 2 : 1;
    const re = new RegExp(escapeRegExp(kw), "gi");
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      if (overlaps(s, e)) continue;
      ranges.push({ start: s, end: e, tier });
    }
  }
  ranges.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });
  return ranges;
}

export interface PlainSegment {
  text: string;
  tier: 0 | HighlightTier;
}

export function rangesToSegments(text: string, ranges: TextRange[]): PlainSegment[] {
  if (ranges.length === 0) return [{ text, tier: 0 }];
  const out: PlainSegment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      out.push({ text: text.slice(cursor, r.start), tier: 0 });
    }
    out.push({ text: text.slice(r.start, r.end), tier: r.tier });
    cursor = Math.max(cursor, r.end);
  }
  if (cursor < text.length) {
    out.push({ text: text.slice(cursor), tier: 0 });
  }
  return out;
}
