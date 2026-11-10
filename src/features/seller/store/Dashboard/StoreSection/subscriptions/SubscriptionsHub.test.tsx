import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const contract = { _id: 'c1', groupId: 'g1', optionId: 'o1', terms: { name: 'Coffee', unit: 'month', count: 1, discountPercent: 10, shippingAmount: 0, taxPercent: 0, maxCycles: null }, items: [{ productId: 'p', variantId: 'v', quantity: 2 }], customerName: 'Ali', customerEmail: 'a@x.com', status: 'active', nextBillingAt: '2026-12-01T00:00:00Z', cyclesDone: 3, lastOrderId: 'o1', pausedReason: null, createdAt: '2026-10-01T00:00:00Z' };
const plan = { _id: 'g1', name: 'Coffee plan', options: [{ id: 'o1', label: 'Every month', unit: 'month', count: 1, discountPercent: 10 }], trialDays: 0, maxCycles: null, productIds: ['p'], variantIds: [], shippingAmount: 0, taxPercent: 0, status: 'active' };

beforeEach(() => {
  get.mockReset(); post.mockReset(); patch.mockReset(); allowManage = true;
  get.mockImplementation((url: string) => Promise.resolve(
    url.endsWith('/report') ? { currency: 'USD', active: 1, paused: 0, cancelledLast30Days: 0, total: 1, monthlyRecurring: 185 }
      : url.endsWith('/groups') ? [plan] : url.endsWith('/upcoming') ? [contract] : { items: [contract], total: 1, page: 1, limit: 50 }));
});
afterEach(cleanup);

describe('SubscriptionsHub', () => {
  it('shows the numbers and the subscriptions, and pauses one', async () => {
    post.mockResolvedValue({});
    render(<SubscriptionsHub />);
    expect(await screen.findByText('Ali')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/pause'));
  });

  it('cancelling asks first', async () => {
    post.mockResolvedValue({});
    render(<SubscriptionsHub />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel subscription' }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel subscription' }).pop() as HTMLElement);
    await waitFor(() => expect(post.mock.calls[0][0]).toBe('/api/selling-plans/s1/contracts/c1/cancel'));
  });

  it('view-only people get no New plan or action buttons', async () => {
    allowManage = false;
    render(<SubscriptionsHub />);
    await screen.findByText('Ali');
    expect(screen.queryByRole('button', { name: /new plan/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  });

  it('creating a plan posts clean numbers', async () => {
    post.mockResolvedValue({});
    render(<SubscriptionsHub />);
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
    render(<SubscriptionsHub />);
    expect(await screen.findByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
