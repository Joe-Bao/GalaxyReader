import type { GraphNode } from "@/lib/types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "two",
  "who",
  "way",
  "use",
  "she",
  "many",
  "then",
  "them",
  "these",
  "some",
  "what",
  "with",
  "from",
  "that",
  "this",
  "have",
  "been",
  "into",
  "more",
  "than",
  "will",
  "also",
  "such",
  "only",
  "over",
  "most",
  "other",
  "about",
  "after",
  "their",
  "there",
  "when",
  "where",
  "which",
  "while",
  "would",
  "could",
  "should",
  "between",
  "through",
  "during",
  "including",
]);

/**
 * Keywords for source highlighting: node title first, then token hits
 * from name + summary + group (length ≥3, stopword-filtered, by frequency).
 */
export function extractSourceKeywords(node: GraphNode | null): string[] {
  if (!node) return [];
  const primary = node.name.trim();
  const raw = `${node.name} ${node.summary} ${node.group}`;
  const tokens = raw.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (STOP.has(t) || t.length < 3) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const byScore = [...freq.entries()].sort(
    (a, b) => b[1] - a[1] || b[0].length - a[0].length
  );

  const out: string[] = [];
  if (primary.length >= 2) {
    out.push(primary);
  }
  const primaryLower = primary.toLowerCase();
  for (const [w] of byScore) {
    if (out.some((x) => x.toLowerCase() === w)) continue;
    if (primaryLower.includes(w) && w.length < primaryLower.length) continue;
    out.push(w);
    if (out.length >= 18) break;
  }
  return out;
}
