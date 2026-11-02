import { describe, expect, it } from 'vitest';
import type { StockCount, StockCountItem } from '@/api/services/stockCounts';
import { buildCountReportHtml, buildCountSheetHtml, summarizeCount } from './stockCountDocuments';

const item = (n: number, over: Partial<StockCountItem> = {}): StockCountItem => ({
  _id: `i${n}`, variantId: `v${n}`, productId: 'p1', sku: `SKU-${n}`, productName: 'Smart Ring', variantLabel: ['Black', 'Silver', 'Blue'][n % 3],
  image: null, systemQty: 20, countedQty: null, ...over,
});

const count = (items: StockCountItem[], status: StockCount['status'] = 'open'): StockCount => ({
  _id: 'c1', storeId: 's1', locationId: null, items, status, startedBy: 'u1', startedAt: '2026-11-02T10:00:00Z', completedAt: null, cancelledAt: null,
});
const store = { name: 'Amara <Wears>', printedBy: 'Sana' };

describe('summarizeCount', () => {
  it('splits matched, short, over and not counted, with unit totals', () => {
    const s = summarizeCount([item(1, { countedQty: 20 }), item(2, { countedQty: 15 }), item(3, { countedQty: 23 }), item(4)]);
    expect(s).toMatchObject({ lines: 4, counted: 3, notCounted: 1, matched: 1, short: 1, over: 1, unitsShort: 5, unitsOver: 3, net: -2 });
  });
});

describe('count sheet', () => {
  it('is blind by default: no system quantity, but has product, variant and SKU', () => {
    const html = buildCountSheetHtml(count([item(1)]), store, { showSystemQty: false, showPhotos: false, paper: 'A4' });
    expect(html).toContain('Smart Ring');
    expect(html).toContain('Silver');
    expect(html).toContain('SKU-1');
    expect(html).not.toContain('>System<');
    expect(html).not.toContain('<td class="n">20</td>');
  });

  it('can include the system quantity and escapes the store name', () => {
    const html = buildCountSheetHtml(count([item(1)]), store, { showSystemQty: true, showPhotos: false, paper: 'A4' });
    expect(html).toContain('<th class="n">System</th>');
    expect(html).toContain('Amara &lt;Wears&gt;');
    expect(html).not.toContain('Amara <Wears>');
  });
});

describe('count report', () => {
  it('lists the differences with signs and the totals', () => {
    const html = buildCountReportHtml(count([item(1, { countedQty: 20 }), item(2, { countedQty: 10 }), item(3, { countedQty: 25 })], 'completed'), store);
    expect(html).toContain('Differences (2)');
    expect(html).toContain('>-10<');
    expect(html).toContain('>+5<');
    expect(html).toContain('All lines (3)');
  });

  it('says so when nothing differs and marks lines that were not counted', () => {
    const html = buildCountReportHtml(count([item(1, { countedQty: 20 }), item(2)]), store);
    expect(html).toContain('No differences');
    expect(html).toContain('not counted');
  });
});

describe('paper sizes and names', () => {
  it('sets the page rule per paper size', () => {
    const c = count([item(1)]);
    expect(buildCountSheetHtml(c, store, { showSystemQty: false, showPhotos: false, paper: 'A5' })).toContain('@page{size:A5');
    expect(buildCountSheetHtml(c, store, { showSystemQty: false, showPhotos: false, paper: '80mm' })).toContain('size:80mm auto');
    expect(buildCountReportHtml(c, store)).toContain('@page{size:A4');
  });

  it('prints who started and who applied the count', () => {
    const c = { ...count([item(1, { countedQty: 19 })], 'completed'), startedByName: 'Bilal', completedByName: 'Sana', completedAt: '2026-11-02T12:00:00Z' };
    const html = buildCountReportHtml(c, store);
    expect(html).toContain('by <b>Bilal</b>');
    expect(html).toContain('by <b>Sana</b>');
    expect(html).toContain('Counted by: Bilal');
    expect(html).toContain('Approved by: Sana');
  });
});
