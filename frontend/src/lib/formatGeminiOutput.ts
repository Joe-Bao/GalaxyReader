/**
 * Normalize model output before markdown render: strip invisible chars,
 * Unicode compatibility forms, and odd spacing so text looks consistent.
 */
export function normalizeAssistantMarkdown(raw: string): string {
  let s = raw ?? "";
  try {
    s = s.normalize("NFKC");
  } catch {
    /* ignore if runtime disallows */
  }
  // Zero-width and BOM-like characters
  s = s.replace(/[\u200B-\u200F\u2028\u2029\u2060\uFEFF]/g, "");
  // Narrow no-break space, figure space, etc.
  s = s.replace(/[\u202F\u2007\u3000]/g, " ");
  s = s.replace(/\u00A0/g, " ");
  // Collapse 3+ newlines (models often emit huge gaps)
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
