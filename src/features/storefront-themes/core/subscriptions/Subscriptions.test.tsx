import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const plans = vi.fn();
const subscribe = vi.fn();
const mine = vi.fn();
const action = vi.fn();
let signedIn = true;
const requireAuth = vi.fn((run: () => void) => { if (signedIn) { run(); return true; } return false; });
vi.mock('@/api/services/sellingPlans', () => ({
  apiPublicPlansFor: (...a: unknown[]) => plans(...a), apiSubscribe: (...a: unknown[]) => subscribe(...a),
  apiMySubscriptions: (...a: unknown[]) => mine(...a), apiSubscriptionAction: (...a: unknown[]) => action(...a),
}));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getToken: () => (signedIn ? 'tok' : null) } }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', baseCurrency: 'USD' } }) }));
vi.mock('@/contexts/AuthGateContext', () => ({ useAuthGate: () => ({ requireAuth }) }));

import { SubscribeBox } from './SubscribeBox';
import { DefaultSubscriptionsPage } from '../../DefaultSubscriptionsPage';

const tokens = { ink: '#000', inkMuted: '#666', border: '#ccc', accent: '#a00' };
const plan = { groupId: 'g1', name: 'Coffee', trialDays: 0, maxCycles: null, shippingAmount: 0, options: [{ optionId: 'o1', label: 'Every month', unit: 'month', count: 1, discountPercent: 10, unitPrice: 90 }] };
const box = () => render(<MemoryRouter><SubscribeBox productId="p1" variantId="v1" quantity={2} format={(n) => `$${n}`} tokens={tokens} /></MemoryRouter>);
const fill = () => {
  for (const [l, v] of [['Full name', 'Ali'], ['Phone', '0300'], ['Address', '1 Road'], ['City', 'Karachi']]) fireEvent.change(screen.getByLabelText(l), { target: { value: v } });
};

beforeEach(() => { plans.mockReset(); subscribe.mockReset(); mine.mockReset(); action.mockReset(); requireAuth.mockClear(); signedIn = true; plans.mockResolvedValue([plan]); });
afterEach(cleanup);

describe('SubscribeBox', () => {
  it('renders nothing when the product has no plan', async () => {
    plans.mockResolvedValue([]);
    const { container } = box();
    await waitFor(() => expect(plans).toHaveBeenCalled());
    expect(container.querySelector('fieldset')).toBeNull();
  });

  it('shows the discounted price per frequency and subscribes with the typed address', async () => {
    subscribe.mockResolvedValue({ contractId: 'c1', firstOrder: { ok: true, orderNumber: 'SUB-1' } });
    box();
    fireEvent.click(await screen.findByLabelText('Subscribe & save'));
    expect(screen.getByText(/Every month · \$90/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Subscribe' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fill();
    fireEvent.click(btn);
    await waitFor(() => expect(subscribe).toHaveBeenCalled());
    expect(subscribe.mock.calls[0]).toEqual(['s1', expect.objectContaining({ groupId: 'g1', optionId: 'o1', variantId: 'v1', quantity: 2, address: expect.objectContaining({ city: 'Karachi' }) })]);
    expect(await screen.findByText(/#SUB-1/)).toBeTruthy();
  });

  it('asks a visitor to sign in first and sends nothing', async () => {
    signedIn = false;
    box();
    fireEvent.click(await screen.findByLabelText('Subscribe & save'));
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(requireAuth).toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe('DefaultSubscriptionsPage', () => {
  const contract = { _id: 'c1', terms: { name: 'Coffee', unit: 'month', count: 1, discountPercent: 10 }, status: 'active', nextBillingAt: '2026-12-01T00:00:00Z', lastOrderId: 'o9', pausedReason: null };
  it('lists my subscriptions and skips the next one', async () => {
    mine.mockResolvedValue([contract]); action.mockResolvedValue({});
    render(<MemoryRouter><DefaultSubscriptionsPage /></MemoryRouter>);
    expect(await screen.findByText('Coffee')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip next' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith('s1', 'c1', 'skip'));
  });

  it('cancelling needs a second confirming click', async () => {
    mine.mockResolvedValue([contract]); action.mockResolvedValue({});
    render(<MemoryRouter><DefaultSubscriptionsPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel subscription' }));
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel it' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith('s1', 'c1', 'cancel'));
  });

  it('shows a retry when loading fails', async () => {
    mine.mockRejectedValue(new Error('down'));
    render(<MemoryRouter><DefaultSubscriptionsPage /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
