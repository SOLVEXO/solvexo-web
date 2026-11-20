import type { BillingTimelineData, BillingTimelineEvent, BillingTimelineKind } from '@/api/services/billingTimeline';

export type PeriodKey = 'all' | 'this_month' | 'last_month' | 'last_90' | string; // string = 'YYYY-MM'

/** ISO from/to for a period choice (local calendar months), or {} for all time. */
export function periodRange(period: PeriodKey, now = new Date()): { from?: string; to?: string } {
  const y = now.getFullYear(), m = now.getMonth();
  const monthBounds = (yy: number, mm: number) => ({ from: new Date(yy, mm, 1).toISOString(), to: new Date(yy, mm + 1, 1, 0, 0, 0, -1).toISOString() });
  if (period === 'all') return {};
  if (period === 'this_month') return monthBounds(y, m);
  if (period === 'last_month') return monthBounds(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1);
  if (period === 'last_90') return { from: new Date(now.getTime() - 90 * 86400000).toISOString(), to: now.toISOString() };
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (match) return monthBounds(Number(match[1]), Number(match[2]) - 1);
  return {};
}

export const KIND_FILTERS: Array<{ id: string; label: string; kinds: BillingTimelineKind[] }> = [
  { id: 'all', label: 'All activity', kinds: [] },
  { id: 'payments', label: 'Payments', kinds: ['payment', 'addon', 'transaction_fee'] },
  { id: 'plans', label: 'Plan changes', kinds: ['trial_started', 'trial_ended', 'plan_change', 'credit'] },
  { id: 'failed', label: 'Failed', kinds: ['payment_failed'] },
  { id: 'refunds', label: 'Refunds', kinds: ['refund'] },
];

/** Groups events (already newest-first) under "November 2026"-style headings, keeping order. */
export function groupByMonth(events: BillingTimelineEvent[]): Array<{ label: string; events: BillingTimelineEvent[] }> {
  const groups: Array<{ label: string; events: BillingTimelineEvent[] }> = [];
  for (const e of events) {
    const label = new Date(e.at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(e); else groups.push({ label, events: [e] });
  }
  return groups;
}

export function money(n: number | null | undefined): string {
  const v = n ?? 0;
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? '−' : ''}$${s}`;
}

export function cardLabel(card?: { brand: string; last4: string } | null): string {
  return card ? `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} ···· ${card.last4}` : '';
}

/** The last N months as { value:'YYYY-MM', label:'November 2026' } for the statement picker. */
export function recentMonths(now = new Date(), count = 12): Array<{ value: string; label: string }> {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  });
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Self-contained, print-ready statement page (opened in a new window and printed / saved as PDF). Every value is HTML-escaped. */
export function buildStatementHtml(data: BillingTimelineData, storeName: string, periodLabel: string): string {
  const s = data.statement;
  const rows = data.events
    .filter(e => e.amountUSD != null || e.creditUSD != null)
    .map(e => {
      const amt = e.amountUSD != null ? money(e.amountUSD) : `${(e.creditUSD ?? 0) > 0 ? '+' : ''}${money(e.creditUSD)} credit`;
      const lines = (e.lineItems ?? []).map(l => `<div class="li">${esc(l.label)}: ${esc(money(l.amountUSD))}</div>`).join('');
      return `<tr><td>${esc(new Date(e.at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }))}</td>`
        + `<td><strong>${esc(e.title)}</strong><div class="muted">${esc(e.description)}</div>${lines}</td>`
        + `<td>${esc(e.status === 'failed' ? 'Failed' : e.status === 'refunded' ? 'Refunded' : e.status === 'pending' ? 'Pending' : e.kind === 'credit' ? 'Credit' : 'Paid')}</td>`
        + `<td class="num">${esc(amt)}</td></tr>`;
    }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Billing statement — ${esc(storeName)}</title><style>
    body{font:13px/1.5 system-ui,Segoe UI,Arial,sans-serif;color:#1d1d1f;margin:32px}
    h1{font-size:20px;margin:0 0 2px}.muted{color:#6b6b6b;font-size:12px}.li{color:#444;font-size:12px;padding-left:8px}
    .totals{display:flex;gap:24px;margin:18px 0;padding:12px 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd}
    .totals div p{margin:0}.totals .v{font-size:16px;font-weight:600}
    table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;text-transform:uppercase;color:#6b6b6b;border-bottom:1px solid #ccc;padding:6px 8px}
    td{padding:8px;border-bottom:1px solid #eee;vertical-align:top}.num{text-align:right;white-space:nowrap}
    @media print{body{margin:12mm}}</style></head><body>
    <h1>Billing statement</h1><div class="muted">${esc(storeName)} · ${esc(periodLabel)} · USD · generated ${esc(new Date().toLocaleDateString('en-US'))}</div>
    <div class="totals"><div><p class="muted">Charged</p><p class="v">${esc(money(s.chargedUSD))}</p></div><div><p class="muted">Refunded</p><p class="v">${esc(money(s.refundedUSD))}</p></div>
    <div><p class="muted">Tax included</p><p class="v">${esc(money(s.taxUSD))}</p></div><div><p class="muted">Net</p><p class="v">${esc(money(s.netUSD))}</p></div></div>
    <table><thead><tr><th>Date</th><th>Description</th><th>Status</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
