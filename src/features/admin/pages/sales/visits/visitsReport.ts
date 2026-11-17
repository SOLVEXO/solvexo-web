import type { BadgeColor } from '@/types';
import type { SalesVisit } from '@/api/services/salesVisits';
import { optionLabel, optionLabels } from './visitOptions';

export const INTEREST_COLOR: Record<string, BadgeColor> = { hot: 'red', warm: 'yellow', cold: 'blue', not_interested: 'gray' };

export type Period = 'today' | 'week' | 'month' | 'all';
/** Start of the chosen period in local time (Monday-based week). */
export function periodStart(p: Period, now = new Date()): Date | null {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === 'today') return d;
  if (p === 'week') { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export const visitDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');
export const visitWhere = (v: Pick<SalesVisit, 'unit' | 'floor'>) => [v.unit, v.floor ? `${optionLabel('floor', v.floor)} floor` : ''].filter(Boolean).join(' · ');

/** One row per visit, every answer in its own column, labels instead of keys. */
export function visitsToCsv(rows: SalesVisit[]): string {
  const cols: [string, (v: SalesVisit) => string | number | null | undefined][] = [
    ['Visited at', v => new Date(v.visitedAt).toISOString()], ['Rep', v => v.adminName], ['Store', v => v.storeName], ['Unit', v => v.unit],
    ['Floor', v => optionLabel('floor', v.floor)], ['Area', v => v.area], ['Category', v => (v.category === 'other' ? v.categoryOther : optionLabel('category', v.category))],
    ['Price range', v => optionLabel('priceRange', v.priceRange)], ['Wholesale', v => optionLabel('wholesale', v.wholesale)],
    ['Contact', v => v.contactName], ['Role', v => optionLabel('contactRole', v.contactRole)], ['WhatsApp', v => v.whatsapp],
    ['OK to message', v => (v.whatsapp ? (v.waPermission ? 'Yes' : 'No') : '')], ['Best time', v => optionLabel('bestTime', v.bestTime)],
    ['Instagram', v => v.instagram], ['Facebook', v => v.facebook], ['Website', v => v.website], ['Sells on', v => optionLabels('sellsOn', v.sellsOn)],
    ['Online orders / month', v => optionLabel('ordersPerMonth', v.ordersPerMonth)], ['Payments', v => optionLabels('payments', v.payments)],
    ['Couriers', v => optionLabels('couriers', v.couriers)], ['Courier booking', v => optionLabel('courierBooking', v.courierBooking)],
    ['Billing / POS', v => (v.billing === 'software' && v.billingSoftware ? `Software: ${v.billingSoftware}` : optionLabel('billing', v.billing))],
    ['Khata', v => optionLabel('khata', v.khata)], ['Busy seasons', v => optionLabels('seasons', v.seasons)], ['Best sellers', v => v.bestSellers],
    ['Biggest problem', v => v.problem], ['Problem tags', v => optionLabels('problemTags', v.problemTags)], ['Objections', v => optionLabels('objections', v.objections)],
    ['Interest', v => optionLabel('interest', v.interest)], ['Next step', v => optionLabel('nextStep', v.nextStep)],
    ['Next step date', v => (v.nextStepAt ? new Date(v.nextStepAt).toISOString().slice(0, 10) : '')],
    ['Latitude', v => v.location?.lat], ['Longitude', v => v.location?.lng], ['Photo', v => v.photoUrl],
  ];
  const cell = (x: unknown) => {
    const s = x === null || x === undefined ? '' : String(x);
    // Quote everything that needs it; a leading = + - @ would run as a formula in Excel, so it gets a ' in front.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) || safe !== s ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [cols.map(c => cell(c[0])).join(','), ...rows.map(r => cols.map(c => cell(c[1](r))).join(','))].join('\r\n');
}
