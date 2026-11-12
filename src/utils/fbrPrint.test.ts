import { describe, expect, it } from 'vitest';
import { buildSolvexoInvoiceHtml } from './solvexoInvoice';
import { buildDocumentsHtml, DEFAULT_DOCUMENT_SETTINGS, SAMPLE_DOCUMENT_ORDER } from './orderDocuments';
import type { SolvexoInvoiceDoc } from '@/api/services/fbrDi';

const doc = (over: Partial<SolvexoInvoiceDoc> = {}): SolvexoInvoiceDoc => ({
  invoice: { id: 'i1', number: 'PINV-202611-000001', date: '2026-11-11T10:00:00Z', status: 'paid', type: 'recurring', planName: 'Grow', currency: 'USD', subtotal: 50, tax: 9, taxLabel: 'Sales Tax', taxRatePercent: 18, total: 59, refunded: 0 },
  seller: { legalName: 'Solvexo (Pvt) Ltd', ntn: '1234567', strn: '0112345678901', address: 'Clifton, Karachi', authority: 'FBR' },
  buyer: { name: 'Ali Store', taxId: '7654321', address: 'Lahore', province: 'PUNJAB' },
  fbr: null,
  ...over,
});
const QR = 'data:image/png;base64,AAAA';

describe('Solvexo invoice (printable)', () => {
  it('shows Solvexo\'s legal identity, the buyer, and the tax split', () => {
    const h = buildSolvexoInvoiceHtml(doc(), null, { autoPrint: false });
    for (const t of ['Solvexo (Pvt) Ltd', 'NTN: 1234567', 'STRN: 0112345678901', 'Registered with FBR', 'Ali Store', 'Tax invoice', 'PINV-202611-000001', '$50.00', 'Sales Tax (18%)', '$9.00', '$59.00', 'Paid']) {
      expect(h).toContain(t);
    }
    expect(h).not.toContain('window.print'); // autoPrint:false
    expect(buildSolvexoInvoiceHtml(doc(), null)).toContain('window.print');
  });

  it('is a plain "Invoice" (no tax line) when no tax was charged, and shows a refund', () => {
    const h = buildSolvexoInvoiceHtml(doc({ invoice: { ...doc().invoice, tax: 0, taxLabel: null, taxRatePercent: 0, total: 50, refunded: 20 } }), null, { autoPrint: false });
    expect(h).toContain('>Invoice<');
    expect(h).not.toContain('Tax invoice');
    expect(h).toContain('Refunded');
    expect(h).toContain('- $20.00');
  });

  it('prints the FBR number and QR only once FBR accepted the invoice', () => {
    const filed = { status: 'submitted' as const, mode: 'production' as const, invoiceNumber: '1234567DI1747119701593', dated: '2026-11-11 10:00:00', qrText: '1234567DI1747119701593', netPKR: 14000, taxPKR: 2520, fxRate: 280 };
    const h = buildSolvexoInvoiceHtml(doc({ fbr: filed }), QR, { autoPrint: false });
    expect(h).toContain('FBR Digital Invoicing System');
    expect(h).toContain('1234567DI1747119701593');
    expect(h).toContain('class="fbr-qr"');
    expect(h).toContain('1 USD = 280 PKR');
    expect(h).not.toContain('TEST invoice');
    const pending = buildSolvexoInvoiceHtml(doc({ fbr: { ...filed, status: 'pending' } }), QR, { autoPrint: false });
    expect(pending).not.toContain('FBR Digital Invoicing System');
    const sandbox = buildSolvexoInvoiceHtml(doc({ fbr: { ...filed, mode: 'sandbox' } }), QR, { autoPrint: false });
    expect(sandbox).toContain('TEST invoice (FBR sandbox)');
  });

  it('escapes names and refuses a non-image QR source', () => {
    const h = buildSolvexoInvoiceHtml(doc({ buyer: { name: '<script>alert(1)</script>', taxId: '', address: 'A & B', province: '' }, fbr: { status: 'submitted', mode: 'production', invoiceNumber: 'X1', dated: null, qrText: 'X1', netPKR: null, taxPKR: null, fxRate: null } }), 'javascript:alert(1)', { autoPrint: false });
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('&lt;script&gt;');
    expect(h).toContain('A &amp; B');
    expect(h).not.toContain('javascript:alert(1)');
    expect(h).not.toContain('class="fbr-qr"');
  });
});

describe('FBR block on the seller\'s order documents', () => {
  const order = { ...SAMPLE_DOCUMENT_ORDER, fbr: { invoiceNumber: '7654321DI1747119701593', qrDataUrl: QR, dated: '2026-11-11 10:00:00', sandbox: false } };
  const store = { name: 'Ali Store', logo: null, contactEmail: null, phone: null, currency: 'PKR' };

  it('is on the invoice with the QR at 1 x 1 inch', () => {
    const h = buildDocumentsHtml('invoice', [order], DEFAULT_DOCUMENT_SETTINGS, store, { preview: true });
    expect(h).toContain('FBR Digital Invoicing System');
    expect(h).toContain('7654321DI1747119701593');
    expect(h).toContain('class="fbr-qr"');
    expect(h).toContain('.fbr-qr{width:1in;height:1in');
  });

  it('is never on the packing slip, and not on an order FBR did not accept', () => {
    expect(buildDocumentsHtml('slip', [order], DEFAULT_DOCUMENT_SETTINGS, store, { preview: true })).not.toContain('FBR Digital Invoicing System');
    expect(buildDocumentsHtml('invoice', [{ ...order, fbr: null }], DEFAULT_DOCUMENT_SETTINGS, store, { preview: true })).not.toContain('FBR Digital Invoicing System');
  });

  it('marks a sandbox invoice as a test and drops an unsafe QR source', () => {
    const t = buildDocumentsHtml('invoice', [{ ...order, fbr: { ...order.fbr, sandbox: true, qrDataUrl: 'https://evil.example/q.png' } }], DEFAULT_DOCUMENT_SETTINGS, store, { preview: true });
    expect(t).toContain('TEST invoice (FBR sandbox)');
    expect(t).not.toContain('evil.example');
  });
});
