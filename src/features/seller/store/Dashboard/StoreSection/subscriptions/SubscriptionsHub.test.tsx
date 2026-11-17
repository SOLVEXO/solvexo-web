import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
let allowManage = true;
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a) } }));
vi.mock('@/components/layouts/StoreLayout', () => ({
  useStoreWorkspace: () => ({ storeId: 's1', store: { baseCurrency: 'USD' } }),
  hasNavPermission: () => allowManage,
  StorePageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <div><h1>{title}</h1>{actions}</div>,
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getUser: () => ({ role: 'seller' }) } }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal', () => ({ EntityPickerModal: () => null }));

import SubscriptionsHub from './SubscriptionsHub';

const contract = {
  _id: 'c1', groupId: 'g1', optionId: 'o1', terms: { name: 'Coffee', unit: 'month', count: 1, discountPercent: 10, shippingAmount: 0, taxPercent: 0, maxCycles: null },
  items: [{ productId: 'p', variantId: 'v', quantity: 2 }], customerName: 'Ali', customerEmail: 'a@x.com', status: 'active', nextBillingAt: '2026-12-01T00:00:00Z', cyclesDone: 3, lastOrderId: 'o1', pausedReason: null, createdAt: '2026-10-01T00:00:00Z',
  shippingAddress: { recipientName: 'Ali Khan', addressLine1: '12 Mall Road', city: 'Lahore', phoneNumber: '0300111' },
  currency: 'USD', estimatedTotal: 18, estimatedShipping: 0, estimatedTax: 0,
  lines: [{ productId: 'p', variantId: 'v', quantity: 2, name: 'Dark Roast Beans', slug: 'beans', image: null, variantLabel: '1 kg', sku: 'B1', available: true, listPrice: 10, unitPrice: 9, lineTotal: 18, priceLocked: true, todayPrice: 12, priceChanged: true }],
};
const detail = { ...contract, history: [{ cycleNo: 3, orderId: 'ord3', orderNumber: 'ORD-77', amount: 18, isPaid: false, paymentStatus: 'pending_verification', orderStatus: 'processing', placedAt: '2026-11-01T00:00:00Z' }, { cycleNo: 2, orderId: 'ord2', orderNumber: 'ORD-66', amount: 18, isPaid: true, paymentStatus: 'paid', orderStatus: 'delivered', placedAt: '2026-10-01T00:00:00Z' }] };
const plan = { _id: 'g1', name: 'Coffee plan', options: [{ id: 'o1', label: 'Every month', unit: 'month', count: 1, discountPercent: 10 }], trialDays: 0, maxCycles: null, productIds: ['p'], variantIds: [], shippingAmount: 0, taxPercent: 0, status: 'active' };

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); allowManage = true;
  get.mockImplementation((url: string) => Promise.resolve(
    url.endsWith('/report') ? { currency: 'USD', active: 1, paused: 0, cancelledLast30Days: 0, total: 1, monthlyRecurring: 185 }
      : url.endsWith('/groups') ? [plan] : url.endsWith('/upcoming') ? [contract] : url.endsWith('/contracts/c1') ? detail : { items: [contract], total: 1, page: 1, limit: 50 }));
});
afterEach(cleanup);

describe('SubscriptionsHub', () => {
  it('shows the numbers and the subscriptions, and pauses one', async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    expect(await screen.findByText('Ali')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    // pausing asks for an optional reason first
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(await screen.findByLabelText('Reason (optional)'), { target: { value: 'Out of stock until Dec' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Pause' }).pop() as HTMLElement);
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/pause'));
    expect(post.mock.calls[0][1]).toEqual({ reason: 'Out of stock until Dec' });
  });

  it('says WHICH product each subscription is for: name, variant, quantity and price', async () => {
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    expect(await screen.findByText('Dark Roast Beans')).toBeTruthy();
    expect(screen.getByText(/1 kg · Qty 2 ×/)).toBeTruthy();
    expect(screen.getByText('Next renewal')).toBeTruthy();
    expect(screen.getByText('Orders so far')).toBeTruthy();
  });

  it('flags a line whose price changed since the customer subscribed, and lets the seller update it', async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    expect(await screen.findByText(/Today's price/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View details' }));
    expect(await screen.findByText(/Prices are locked at what the customer agreed/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: "Update to today's prices" }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/reprice'));
  });

  it('Skip next moves the renewal on without asking', async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Skip next' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/skip'));
  });

  it('View details shows the customer, the delivery address and every order placed', async () => {
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'View details' }));
    expect(await screen.findByText('ORD-77')).toBeTruthy();
    expect(screen.getByText('ORD-66')).toBeTruthy();
    expect(screen.getByText('a@x.com')).toBeTruthy();
    expect(screen.getByText(/12 Mall Road/)).toBeTruthy();
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(screen.getByText('Unpaid')).toBeTruthy();
  });

  it('cancelling asks first', async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel subscription' }).pop() as HTMLElement);
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/cancel'));
  });

  it('view-only people get no New plan or action buttons', async () => {
    allowManage = false;
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    await screen.findByText('Ali');
    expect(screen.queryByRole('button', { name: /new plan/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  });

  it('creating a plan posts clean numbers', async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    await screen.findByText('Ali');
    fireEvent.click(screen.getByRole('button', { name: /new plan/i }));
    fireEvent.change(await screen.findByLabelText('Plan name'), { target: { value: 'Tea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/groups');
    expect(post.mock.calls[0][1]).toMatchObject({ name: 'Tea', options: [{ unit: 'month', count: 1, discountPercent: 10 }], trialDays: 0, maxCycles: null, productIds: [] });
  });

  it('shows a retry when loading fails', async () => {
    get.mockRejectedValue(new Error('down'));
    render(<MemoryRouter><SubscriptionsHub /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
