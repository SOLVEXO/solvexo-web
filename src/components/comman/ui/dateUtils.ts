/*
 * Pure date helpers shared by the date / date-time / time / range pickers.
 * Values travel as plain strings (the same shape a native <input> gives):
 *   date      "YYYY-MM-DD"
 *   datetime  "YYYY-MM-DDTHH:mm"   (local time, no zone)
 *   time      "HH:mm"              (24 hour)
 * Nothing here touches the time zone: a date string is a calendar day, not an instant.
 */

export interface Ymd { y: number; m: number; d: number }   // m is 0-based like Date

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString({ y, m, d }: Ymd): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** "2026-11-25" (or a full datetime string) -> parts. Returns null for empty / impossible dates (2026-02-31). */
export function parseDateString(v: string | null | undefined): Ymd | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const probe = new Date(y, mo, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== mo || probe.getDate() !== d) return null;
  return { y, m: mo, d };
}

/** "13:05" -> { h24: 13, minute: 5 } */
export function parseTimeString(v: string | null | undefined): { h24: number; minute: number } | null {
  if (!v) return null;
  const m = /(?:^|T)(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  const h24 = Number(m[1]), minute = Number(m[2]);
  if (h24 > 23 || minute > 59) return null;
  return { h24, minute };
}

export function toTimeString(h24: number, minute: number): string {
  return `${pad(h24)}:${pad(minute)}`;
}

export function toDateTimeString(date: Ymd, h24: number, minute: number): string {
  return `${toDateString(date)}T${toTimeString(h24, minute)}`;
}

export function to12h(h24: number): { hour: number; ampm: 'AM' | 'PM' } {
  return { hour: h24 % 12 || 12, ampm: h24 >= 12 ? 'PM' : 'AM' };
}

export function to24h(hour: number, ampm: 'AM' | 'PM'): number {
  return ampm === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
}

export function todayYmd(now: Date = new Date()): Ymd {
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

/** Negative / 0 / positive like a sort comparator. */
export function compareYmd(a: Ymd, b: Ymd): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function sameYmd(a: Ymd | null, b: Ymd | null): boolean {
  return !!a && !!b && compareYmd(a, b) === 0;
}

export function addDays(v: Ymd, n: number): Ymd {
  const t = new Date(v.y, v.m, v.d + n);
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

export function addMonths(v: Ymd, n: number): Ymd {
  const t = new Date(v.y, v.m + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return { y: t.getFullYear(), m: t.getMonth(), d: Math.min(v.d, last) };
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function clampYmd(v: Ymd, min: Ymd | null, max: Ymd | null): Ymd {
  if (min && compareYmd(v, min) < 0) return min;
  if (max && compareYmd(v, max) > 0) return max;
  return v;
}

/** Six-or-fewer week rows for a month; `null` pads the start and end. `weekStart` 0 = Sunday, 1 = Monday. */
export function monthCells(y: number, m: number, weekStart: 0 | 1 = 0): (number | null)[] {
  const first = (new Date(y, m, 1).getDay() - weekStart + 7) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function startOfWeek(v: Ymd, weekStart: 0 | 1 = 0): Ymd {
  const dow = new Date(v.y, v.m, v.d).getDay();
  return addDays(v, -((dow - weekStart + 7) % 7));
}

/** Short weekday headings in the page language, starting at `weekStart`. */
export function weekdayLabels(locale: string | undefined, weekStart: 0 | 1 = 0, width: 'narrow' | 'short' = 'short'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: width });
  // 2023-01-01 was a Sunday
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + ((i + weekStart) % 7))));
}

export function monthName(locale: string | undefined, m: number, width: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(locale, { month: width }).format(new Date(2023, m, 1));
}

export function formatDate(v: Ymd | null, locale?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!v) return '';
  return new Date(v.y, v.m, v.d).toLocaleDateString(locale, opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(h24: number, minute: number, locale?: string): string {
  return new Date(2023, 0, 1, h24, minute).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** The browser's language, or `undefined` on the server. */
export function defaultLocale(): string | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.language;
}

/** Locales whose week starts on Monday (most of the world); the US, Canada, Japan, Pakistan, etc. start on Sunday. */
export function weekStartFor(locale: string | undefined): 0 | 1 {
  const region = (locale ?? '').split('-')[1]?.toUpperCase();
  const sunday = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'IN', 'PK', 'PH', 'AU', 'IL', 'SA', 'AE', 'EG', 'KR', 'TW', 'HK', 'ZA', 'KE']);
  if (!region) return 0;
  return sunday.has(region) ? 0 : 1;
}

export interface RangePreset { id: string; label: string; range: () => { from: Ymd; to: Ymd } }

/** The presets analytics screens expect. All end today (or the last full period), in the visitor's local time. */
export function defaultRangePresets(now: Date = new Date()): RangePreset[] {
  const t = todayYmd(now);
  const monthStart = { y: t.y, m: t.m, d: 1 };
  const prevMonth = addMonths(monthStart, -1);
  return [
    { id: 'today',      label: 'Today',        range: () => ({ from: t, to: t }) },
    { id: 'yesterday',  label: 'Yesterday',    range: () => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
    { id: 'last7',      label: 'Last 7 days',  range: () => ({ from: addDays(t, -6), to: t }) },
    { id: 'last30',     label: 'Last 30 days', range: () => ({ from: addDays(t, -29), to: t }) },
    { id: 'last90',     label: 'Last 90 days', range: () => ({ from: addDays(t, -89), to: t }) },
    { id: 'thisMonth',  label: 'This month',   range: () => ({ from: monthStart, to: t }) },
    { id: 'lastMonth',  label: 'Last month',   range: () => ({ from: prevMonth, to: { ...prevMonth, d: daysInMonth(prevMonth.y, prevMonth.m) } }) },
    { id: 'thisYear',   label: 'This year',    range: () => ({ from: { y: t.y, m: 0, d: 1 }, to: t }) },
  ];
}
