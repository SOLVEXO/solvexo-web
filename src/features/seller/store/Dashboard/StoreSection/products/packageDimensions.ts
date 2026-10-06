/** Blank/invalid/negative -> null, otherwise the number (cm). */
export function dimensionPayload(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function dimensionText(v: number | null | undefined): string {
  return v == null ? '' : String(v);
}
