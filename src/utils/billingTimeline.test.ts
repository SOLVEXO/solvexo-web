import { describe, it, expect } from 'vitest';
import type { BillingTimelineEvent } from '@/api/services/billingTimeline';
import { periodRange, groupByMonth, money, cardLabel, recentMonths, buildStatementHtml } from './billingTimeline';

const ev = (id: string, at: string): BillingTimelineEvent => ({ id, at, kind: 'payment', status: 'success', title: 't', description: 'd', amountUSD: 1 });

describe('billingTimeline helpers', () => {
  const now = new Date(2026, 10, 20, 12); // 20 Nov 2026 (local)
  it('periodRange: all time has no bounds; this/last month are calendar months', () => {
    expect(periodRange('all', now)).toEqual({});
    const t = periodRange('this_month', now);
    expect(new Date(t.from!).getMonth()).toBe(10);
    expect(new Date(t.to!).getMonth()).toBe(10);
    expect(new Date(t.to!).getDate()).toBe(30);
    expect(new Date(periodRange('last_month', now).from!).getMonth()).toBe(9);
  });
  it('periodRange: January rolls "last month" back to December of the previous year', () => {
    const r = periodRange('last_month', new Date(2027, 0, 15));
    expect(new Date(r.from!).getFullYear()).toBe(2026);
    expect(new Date(r.from!).getMonth()).toBe(11);
  });
  it('periodRange: a YYYY-MM key selects exactly that month', () => {
    const r = periodRange('2026-02', now);
    expect(new Date(r.from!).getMonth()).toBe(1);
    expect(new Date(r.to!).getDate()).toBe(28);
  });
  it('groupByMonth keeps newest-first order and merges neighbours of the same month', () => {
    const g = groupByMonth([ev('a', '2026-11-18T10:00:00'), ev('b', '2026-11-02T10:00:00'), ev('c', '2026-10-30T10:00:00')]);
    expect(g.map(x => x.events.length)).toEqual([2, 1]);
    expect(g[0].label).toContain('2026');
  });
  it('money formats signed USD', () => {
    expect(money(1234.5)).toBe('$1,234.50');
    expect(money(-10)).toBe('−$10.00');
    expect(money(null)).toBe('$0.00');
  });
  it('cardLabel / recentMonths', () => {
    expect(cardLabel({ brand: 'visa', last4: '4242' })).toBe('Visa ···· 4242');
    expect(cardLabel(null)).toBe('');
    expect(recentMonths(now, 3).map(x => x.value)).toEqual(['2026-11', '2026-10', '2026-09']);
  });
});

describe('buildStatementHtml', () => {
  it('escapes HTML in store name and event text and lists totals', () => {
    const html = buildStatementHtml({
      summary: {} as never,
      statement: { from: null, to: null, chargedUSD: 60, refundedUSD: 10, taxUSD: 6, netUSD: 50, paymentCount: 1, failedCount: 0 },
      events: [{ ...ev('a', '2026-11-18T10:00:00'), title: '<img src=x onerror=alert(1)>', amountUSD: 60 }],
    }, 'Ali <b>Shoes</b>', 'November 2026');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>Shoes');
    expect(html).toContain('&lt;img');
    expect(html).toContain('$60.00');
    expect(html).toContain('$50.00');
  });
});
