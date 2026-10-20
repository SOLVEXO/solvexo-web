import { describe, it, expect } from 'vitest';
import { buildDocumentsHtml, DEFAULT_DOCUMENT_SETTINGS, SAMPLE_DOCUMENT_ORDER, toDocumentOrder, type OrderDocumentSettings } from './orderDocuments';

const store = { name: 'Amara Wears', logo: 'https://cdn.example.com/logo.png', contactEmail: 'hi@amara.test', phone: null, currency: 'USD' };
const html = (kind: 'slip' | 'invoice', over: Partial<OrderDocumentSettings> = {}, preview = true) =>
  buildDocumentsHtml(kind, [SAMPLE_DOCUMENT_ORDER], { ...DEFAULT_DOCUMENT_SETTINGS, ...over }, store, { preview });

describe('order documents', () => {
  it('packing slip has no prices by default, invoice shows the totals', () => {
    const slip = html('slip');
    expect(slip).toContain('Packing slip');
    expect(slip).not.toContain('Subtotal');
    expect(slip).toContain('Collect on delivery');
    const inv = html('invoice');
    expect(inv).toContain('Invoice');
    expect(inv).toContain('Subtotal');
    expect(inv).toContain('Discount (WELCOME5)');
    expect(inv).toContain('Amount to collect');
  });

  it('slip prices can be switched on', () => {
    expect(html('slip', { slipShowPrices: true })).toContain('Subtotal');
  });

  it('escapes everything the seller or customer typed', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const out = buildDocumentsHtml('invoice', [{ ...SAMPLE_DOCUMENT_ORDER, customerName: evil, customerNote: evil }], {
      ...DEFAULT_DOCUMENT_SETTINGS, companyName: evil, addressText: evil, invoiceTerms: evil, invoiceFooter: evil, watermarkEnabled: true, watermarkType: 'text', watermarkText: evil,
    }, { ...store, logo: 'javascript:alert(1)' }, { preview: true });
    expect(out).not.toContain('<img src=x');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('&lt;img src=x');
  });

  it('watermark is off unless enabled, then renders as a logo or text', () => {
    expect(html('slip')).not.toContain('class="wm"');
    expect(html('slip', { watermarkEnabled: true })).toContain('class="wm"');
    expect(html('slip', { watermarkEnabled: true })).toContain('logo.png');
    const text = html('slip', { watermarkEnabled: true, watermarkType: 'text', watermarkText: 'PAID COPY' });
    expect(text).toContain('PAID COPY');
    const tiled = html('slip', { watermarkEnabled: true, watermarkPosition: 'tiled' });
    expect(tiled).toContain('background-repeat:space');
  });

  it('a logo watermark falls back to the store name when there is no logo', () => {
    const out = buildDocumentsHtml('slip', [SAMPLE_DOCUMENT_ORDER], { ...DEFAULT_DOCUMENT_SETTINGS, watermarkEnabled: true }, { ...store, logo: null }, { preview: true });
    expect(out).toMatch(/class="wm"[^>]*>.*Amara Wears/s);
  });

  it('print version waits for images then prints; preview does not', () => {
    expect(html('slip', {}, false)).toContain('window.print()');
    expect(html('slip', {}, true)).not.toContain('window.print()');
  });

  it('uses the chosen paper size', () => {
    expect(html('slip', { paperSize: 'a5' })).toContain('size:A5');
    expect(html('slip', { paperSize: 'thermal80' })).toContain('size:80mm auto');
  });

  it('maps an order detail, skipping cancelled lines and using the server totals', () => {
    const o = toDocumentOrder({
      orderNumber: 'ORD-1', createdAt: '2026-01-01', currency: 'PKR', paymentType: 'stripe', paymentStatus: 'paid', isPaid: true, paidAt: null, orderId: '1',
      shippingAddress: null, buyer: { name: 'A', email: 'a@x.com', phone: '' }, customerNote: ' hello ',
      sellerOrder: { items: [
        { name: 'A', quantity: 1, price: 10, totalPrice: 10, status: 'pending', type: 'physical', options: [] },
        { name: 'B', quantity: 1, price: 5, totalPrice: 5, status: 'cancelled', type: 'physical', options: [] },
      ] },
      totals: { currency: 'PKR', subtotal: 10, discount: 0, shipping: 0, tax: 0, includedTax: 0, total: 10, giftCard: 0, storeCredit: 0, payable: 10, couponCode: null },
    } as never);
    expect(o.items).toHaveLength(1);
    expect(o.customerNote).toBe('hello');
    expect(o.totals?.payable).toBe(10);
  });
});
