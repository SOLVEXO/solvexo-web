import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const listInvoices = vi.fn();
vi.mock('@/api/services/platformPlans', () => ({ apiGetStoreInvoices: (...a: unknown[]) => listInvoices(...a) }));
vi.mock('@/utils/solvexoInvoice', () => ({ openSolvexoInvoice: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

import { BillingInvoicesList } from './BillingInvoicesList';

const inv = (over: Record<string, unknown> = {}) => ({
  _id: 'i1', invoiceNumber: 'INV-1', amountUSD: 32, subtotalUSD: 29, taxAmountUSD: 3, taxLabel: 'VAT', taxRatePercent: 10, status: 'paid',
  refundedAmountUSD: 0, createdAt: '2026-10-10T00:00:00Z', hostedInvoiceUrl: null, invoicePdfUrl: 'https://x/pdf', ...over,
});
const page = (invoices: unknown[], pages = 1) => ({ data: { invoices, total: invoices.length, pages, page: 1, limit: 10 } });

describe('BillingInvoicesList', () => {
  beforeEach(() => listInvoices.mockReset());
  afterEach(() => cleanup());

  it('shows number, amount with tax split, status, and invoice/download links', async () => {
    listInvoices.mockResolvedValue(page([inv({ refundedAmountUSD: 5 })]));
    render(<BillingInvoicesList storeId="s1" />);
    expect(await screen.findByText('INV-1')).toBeInTheDocument();
    expect(screen.getByText(/\$29\.00 \+ \$3\.00 VAT 10%/)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.00 refunded/)).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Download').closest('a')).toHaveAttribute('href', 'https://x/pdf');
  });

  it('a failed invoice offers "Pay now" instead of Download and no Invoice view', async () => {
    listInvoices.mockResolvedValue(page([inv({ status: 'failed', hostedInvoiceUrl: 'https://x/pay', invoicePdfUrl: null })]));
    render(<BillingInvoicesList storeId="s1" />);
    expect(await screen.findByText('Pay now')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Invoice' })).not.toBeInTheDocument();
  });

  it('empty state, error + retry, and paging', async () => {
    listInvoices.mockResolvedValueOnce(page([]));
    const { unmount } = render(<BillingInvoicesList storeId="s1" />);
    expect(await screen.findByText(/No invoices yet/)).toBeInTheDocument();
    unmount();

    listInvoices.mockReset();
    listInvoices.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(page([inv()], 3));
    render(<BillingInvoicesList storeId="s1" />);
    fireEvent.click(await screen.findByText('Retry'));
    expect(await screen.findByText('INV-1')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(listInvoices).toHaveBeenLastCalledWith('s1', { page: 2, limit: 10 }));
  });
});
