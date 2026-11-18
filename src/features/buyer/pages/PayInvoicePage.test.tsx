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
  StripeCardPayment: ({ submitLabel, onConfirmed, accent }: { submitLabel: string; onConfirmed: () => void; accent?: string }) => <button type="button" data-accent={accent ?? ''} onClick={onConfirmed}>{submitLabel}</button>,
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

  it('wears the store brand colour: top bar, pay button (readable text) and the card form', async () => {
    getInvoice.mockResolvedValue({ data: invoice({ accentColor: '#6b2d44' }) });
    createIntent.mockResolvedValue({ data: { clientSecret: 'cs_1' } });
    open();
    const pay = await screen.findByRole('button', { name: /^Pay / });
    expect(pay.style.background).toBe('rgb(107, 45, 68)');
    expect(pay.style.color).toBe('rgb(255, 255, 255)'); // white on a dark colour
    expect((screen.getByTestId('pay-card').firstElementChild as HTMLElement).style.background).toBe('rgb(107, 45, 68)');
    fireEvent.click(pay);
    expect((await screen.findByRole('button', { name: /Pay .* 100.00/ })).getAttribute('data-accent')).toBe('#6b2d44');
  });

  it('a light brand colour gets dark text, and a store with no colour keeps the default orange', async () => {
    getInvoice.mockResolvedValue({ data: invoice({ accentColor: '#ffe600' }) });
    open();
    expect((await screen.findByRole('button', { name: /^Pay / })).style.color).toBe('rgb(17, 17, 17)');
    cleanup();
    getInvoice.mockResolvedValue({ data: invoice({ accentColor: null }) });
    open();
    expect((await screen.findByRole('button', { name: /^Pay / })).style.background).toBe('rgb(217, 119, 87)');
  });

  it('without online card payments it tells the customer to contact the store', async () => {
    stripeOn = false;
    getInvoice.mockResolvedValue({ data: invoice() });
    open();
    expect(await screen.findByText(/contact Amarawears directly/)).toBeTruthy();
  });
});
