import { ts } from '@/utils/tStatic';

const DAY_MS = 86_400_000;

/** "Arrives Oct 24 - Oct 28" from the zone's own min/max days, written in the shopper's language. */
export function arrivalText(minDays: number | null | undefined, maxDays: number | null | undefined, lang: string, today: Date = new Date()): string | null {
  const min = minDays ?? maxDays;
  const max = maxDays ?? minDays;
  if (min == null || max == null) return null;
  const fmt = (d: Date) => { try { return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(d); } catch { return d.toDateString(); } };
  const from = fmt(new Date(today.getTime() + min * DAY_MS));
  const to = fmt(new Date(today.getTime() + max * DAY_MS));
  return from === to ? ts('product.arrivesOn', 'Arrives {{date}}', { date: from }) : ts('product.arrivesRange', 'Arrives {{from}} - {{to}}', { from, to });
}


export function countryName(code: string, lang: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return code;
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? code; } catch { return code; }
}
