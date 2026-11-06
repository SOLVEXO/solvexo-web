import { describe, expect, it } from 'vitest';
import { parseQuickOrderText, termsText } from './b2bTerms';

describe('termsText', () => {
  it('names each kind of payment terms', () => {
    expect(termsText({ type: 'net', netDays: 45 })).toBe('Net 45');
    expect(termsText({ type: 'net' })).toBe('Net 30');
    expect(termsText({ type: 'due_on_order' })).toBe('Due on order');
    expect(termsText({ type: 'due_on_fulfilment' })).toBe('Due on fulfilment');
    expect(termsText(null)).toBe('');
  });
});

describe('parseQuickOrderText', () => {
  it('reads comma, tab and space separated lines, defaults the quantity to 1, skips blanks and a header row', () => {
    const rows = parseQuickOrderText('SKU,Quantity\nAB-1, 12\n\nCD-2\t6\nEF-3 24\nGH-4');
    expect(rows).toEqual([{ sku: 'AB-1', quantity: 12 }, { sku: 'CD-2', quantity: 6 }, { sku: 'EF-3', quantity: 24 }, { sku: 'GH-4', quantity: 1 }]);
  });
  it('keeps bad quantities as 0 so the server reports them, and caps the list at 100 lines', () => {
    expect(parseQuickOrderText('AB-1, abc\nCD-2, 1.9')).toEqual([{ sku: 'AB-1', quantity: 0 }, { sku: 'CD-2', quantity: 1 }]);
    expect(parseQuickOrderText(Array.from({ length: 150 }, (_, i) => `S${i},1`).join('\n'))).toHaveLength(100);
  });
  it('handles quoted CSV cells and Windows line endings', () => {
    expect(parseQuickOrderText('"AB-1","5"\r\n"CD 2","3"')).toEqual([{ sku: 'AB-1', quantity: 5 }, { sku: 'CD 2', quantity: 3 }]);
  });
});
