/** "10k+", "4.8", "1,200 items" -> prefix / number / suffix, so only the number counts up. Anything else stays as typed. */
export function parseStatValue(raw: string): { prefix: string; target: number; decimals: number; grouped: boolean; suffix: string } | null {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(raw.trim());
  if (!m) return null;
  const digits = m[2].replace(/,/g, '');
  const target = Number(digits);
  if (!Number.isFinite(target)) return null;
  return { prefix: m[1], target, decimals: digits.includes('.') ? digits.split('.')[1].length : 0, grouped: m[2].includes(','), suffix: m[3] };
}

export function formatStat(n: number, p: { decimals: number; grouped: boolean }): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals, useGrouping: p.grouped });
}
