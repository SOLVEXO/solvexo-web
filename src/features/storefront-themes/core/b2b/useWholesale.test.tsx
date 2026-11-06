import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const standing = vi.fn();
const prices = vi.fn();
let token: string | null = 'tok';
let wholesaleOnly = true;
vi.mock('@/api/services/b2bStorefront', () => ({ apiGetWholesaleStanding: (...a: unknown[]) => standing(...a), apiGetB2BPrices: (...a: unknown[]) => prices(...a) }));
vi.mock('@/api/services/auth', () => ({ TokenStorage: { getToken: () => token } }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 's1', wholesaleOnly } }) }));

import { resetWholesaleStanding, useWholesaleGate, useWholesalePrice } from './useWholesale';

function Probe({ variantId, qty }: { variantId?: string; qty: number }) {
  const g = useWholesaleGate();
  const p = useWholesalePrice(variantId, qty, g.approved);
  return <div data-testid="out">{JSON.stringify({ locked: g.locked, approved: g.approved, loading: g.loading, signedIn: g.signedIn, price: p?.unitPrice ?? null })}</div>;
}
const read = () => JSON.parse(screen.getByTestId('out').textContent ?? '{}');

beforeEach(() => { standing.mockReset(); prices.mockReset(); resetWholesaleStanding(); token = 'tok'; wholesaleOnly = true; });
afterEach(cleanup);

describe('useWholesaleGate / useWholesalePrice', () => {
  it('a wholesale-only store is locked for a signed-in customer who is not a company buyer', async () => {
    standing.mockResolvedValue({ status: 'none' });
    render(<Probe qty={1} />);
    await waitFor(() => expect(read().loading).toBe(false));
    expect(read()).toMatchObject({ locked: true, approved: false, signedIn: true });
  });

  it('a visitor is locked without any request', async () => {
    token = null;
    render(<Probe qty={1} />);
    await waitFor(() => expect(read().loading).toBe(false));
    expect(read()).toMatchObject({ locked: true, signedIn: false });
    expect(standing).not.toHaveBeenCalled();
  });

  it('an approved buyer is unlocked and gets the server price for the variant and quantity', async () => {
    standing.mockResolvedValue({ status: 'approved', companyName: 'Acme' });
    prices.mockResolvedValue({ b2b: true, lines: [{ variantId: 'v1', available: true, unitPrice: 70 }] });
    render(<Probe variantId="v1" qty={12} />);
    await waitFor(() => expect(read().price).toBe(70));
    expect(read()).toMatchObject({ locked: false, approved: true });
    expect(prices).toHaveBeenCalledWith('s1', [{ variantId: 'v1', quantity: 12 }]);
  });

  it('a retail store never locks, and a non-company customer never asks for wholesale prices', async () => {
    wholesaleOnly = false;
    standing.mockResolvedValue({ status: 'none' });
    render(<Probe variantId="v1" qty={1} />);
    await waitFor(() => expect(read().loading).toBe(false));
    expect(read()).toMatchObject({ locked: false, approved: false, price: null });
    expect(prices).not.toHaveBeenCalled();
  });

  it('asks the server for the standing only once for several callers', async () => {
    standing.mockResolvedValue({ status: 'none' });
    render(<><Probe qty={1} /><span /></>);
    render(<Probe qty={2} />);
    await waitFor(() => expect(screen.getAllByTestId('out').length).toBe(2));
    expect(standing).toHaveBeenCalledTimes(1);
  });
});
