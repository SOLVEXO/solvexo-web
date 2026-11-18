import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getInvoice = vi.fn();
const createIntent = vi.fn();
let stripeOn = true;
vi.mock('@/api/services/draftOrders', () => ({
  apiGetPublicInvoice: (...a: unknown[]) => getInvoice(...a),
  apiCreateInvoicePaymentIntent: (...a: unknown[]) => createIntent(...a),
}));
vi.mock('@/components/comman/ui/StripeCardPayment', () => ({
  isStripeConfigured: () => stripeOn,
  StripeCardPayment: ({ submitLabel, onConfirmed }: { submitLabel: string; onConfirmed: () => void }) => <button type="button" onClick={onConfirmed}>{submitLabel}</button>,
}));

import PayInvoicePage from './PayInvoicePage';

const invoice = (over: Record<string, unknown> = {}) => ({
  customerName: 'Uzair', storeName: 'Amarawears', storeLogo: null, items: [{ name: 'Belt', image: null, quantity: 1, unitPrice: 100 }],
  subtotal: 100, discountAmount: 0, shippingAmount: 0, taxAmount: 0, total: 100, currency: 'PKR', isPaid: false, dueDate: null, ...over,
});
const open = () => render(<MemoryRouter initialEntries={['/pay-invoice/tok']}><Routes><Route path="/pay-invoice/:token" element={<PayInvoicePage />} /></Routes></MemoryRouter>);

beforeEach(() => { getInvoice.mockReset(); createIntent.mockReset(); stripeOn = true; });
afterEach(cleanup);

describe('Pay invoice page', () => {
  it('an invoice that was ALREADY paid says so plainly, and offers no payment', async () => {
    getInvoice.mockResolvedValue({ data: invoice({ isPaid: true }) });
    open();
    expect(await screen.findByText('This invoice has already been paid.')).toBeTruthy();
    expect(screen.getByText(/nothing more to pay/i)).toBeTruthy();
    expect(screen.queryByText('Payment received — thank you!')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Pay / })).toBeNull();
  });

  it('an unpaid invoice shows the pay button, and after the customer pays here it says payment received', async () => {
    getInvoice.mockResolvedValue({ data: invoice() });
    createIntent.mockResolvedValue({ data: { clientSecret: 'cs_1' } });
    open();
    fireEvent.click(await screen.findByRole('button', { name: /^Pay / }));
    await waitFor(() => expect(createIntent).toHaveBeenCalledWith('tok'));
    fireEvent.click(await screen.findByRole('button', { name: /Pay .* 100.00/ })); // the card form's own submit (mocked)
    expect(await screen.findByText('Payment received — thank you!')).toBeTruthy();
    expect(screen.queryByText('This invoice has already been paid.')).toBeNull();
  });

  it('without online card payments it tells the customer to contact the store', async () => {
    stripeOn = false;
    getInvoice.mockResolvedValue({ data: invoice() });
    open();
    expect(await screen.findByText(/contact Amarawears directly/)).toBeTruthy();
  });
});
