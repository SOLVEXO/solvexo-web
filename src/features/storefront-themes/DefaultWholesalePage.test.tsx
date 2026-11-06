import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const standing = vi.fn();
const apply = vi.fn();
const resolve = vi.fn();
const addToCart = vi.fn();
vi.mock('@/api/services/b2bStorefront', () => ({
  apiGetWholesaleStanding: (...a: unknown[]) => standing(...a),
  apiApplyForWholesale: (...a: unknown[]) => apply(...a),
  apiQuickOrderResolve: (...a: unknown[]) => resolve(...a),
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getToken: () => 'tok' } }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', baseCurrency: 'PKR' } }) }));
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart }) }));

import { DefaultWholesalePage } from './DefaultWholesalePage';

const renderPage = () => render(<MemoryRouter><DefaultWholesalePage /></MemoryRouter>);

afterEach(cleanup);
beforeEach(() => { standing.mockReset(); apply.mockReset(); resolve.mockReset(); addToCart.mockReset(); });

describe('DefaultWholesalePage', () => {
  it('shows the application form to a customer without a company and sends it', async () => {
    standing.mockResolvedValueOnce({ status: 'none' }).mockResolvedValueOnce({ status: 'pending', companyName: 'Acme' });
    apply.mockResolvedValue({ id: 'a1', status: 'pending' });
    renderPage();
    fireEvent.change(await screen.findByLabelText(/Company name/), { target: { value: ' Acme ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send application' }));
    await waitFor(() => expect(apply).toHaveBeenCalledWith('s1', { companyName: 'Acme', taxId: undefined, phone: undefined, message: undefined }));
    expect(await screen.findByText(/waiting for review/)).toBeTruthy();
  });

  it('requires a company name before sending', async () => {
    standing.mockResolvedValue({ status: 'none' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Send application' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(apply).not.toHaveBeenCalled();
  });

  it('shows the rejection reason and lets the customer apply again', async () => {
    standing.mockResolvedValue({ status: 'rejected', companyName: 'Acme', decisionNote: 'Need a trade licence' });
    renderPage();
    expect(await screen.findByText(/Need a trade licence/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send application' })).toBeTruthy();
  });

  it('approved buyer: checks a quick order list, shows errors per line and adds only the good lines to the cart', async () => {
    standing.mockResolvedValue({ status: 'approved', companyName: 'Acme', locationName: 'HQ', role: 'ordering', taxExempt: false, paymentTerms: { type: 'net', netDays: 30 }, allowedPaymentMethods: [], hasCatalog: true });
    resolve.mockResolvedValue({ lines: [
      { sku: 'AB-1', quantity: 12, ok: true, productId: 'p1', variantId: 'v1', name: 'Widget', type: 'physical', unitPrice: 70 },
      { sku: 'ZZ', quantity: 1, ok: false, error: 'SKU not found' },
    ] });
    addToCart.mockResolvedValue(true);
    renderPage();
    expect(await screen.findByText(/Payment terms: Net 30/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('SKUs and quantities'), { target: { value: 'AB-1, 12\nZZ, 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check list' }));
    expect(await screen.findByText('SKU not found')).toBeTruthy();
    expect(resolve).toHaveBeenCalledWith('s1', [{ sku: 'AB-1', quantity: 12 }, { sku: 'ZZ', quantity: 1 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Add 1 item(s) to cart' }));
    await waitFor(() => expect(addToCart).toHaveBeenCalledWith('p1', 'v1', 'physical', 12));
    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('1 item(s) added to your cart.')).toBeTruthy();
  });

  it('shows an error with a retry when the standing cannot be loaded', async () => {
    standing.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ status: 'none' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Send application' })).toBeTruthy();
  });
});
