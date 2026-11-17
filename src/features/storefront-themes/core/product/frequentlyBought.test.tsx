import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const added: unknown[][] = [];
vi.mock('@/contexts/CartContext', () => ({ useCartContext: () => ({ addToCart: async (...a: unknown[]) => { added.push(a); return true; }, adding: null }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n, canConvert: () => false, fixedPriceFor: () => null, ratesLoaded: true }) }));
vi.mock('@/api/services/merchandising', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/services/merchandising')>()),
  apiPublicRecommendations: () => Promise.resolve({ data: { items: [
    { id: 'P2', variantId: 'v2', type: 'physical', slug: 'cap', name: 'Cap', image: null, price: 10, compareAtPrice: null, source: 'manual' },
    { id: 'P3', variantId: 'v3', type: 'physical', slug: 'bag', name: 'Bag', image: null, price: 20, compareAtPrice: null, source: 'auto' },
  ] } }),
}));
import { FrequentlyBought } from './FrequentlyBought';

afterEach(() => { cleanup(); added.length = 0; });
const tokens = { ink: '#111', inkMuted: '#777', border: '#ddd', radius: 8, accent: '#000', accentInk: '#fff' };
const main = { productId: 'P1', variantId: 'v1', type: 'physical' as const, name: 'Tee', image: null, price: 30, currency: 'USD', canBuy: true };

describe('Frequently bought together', () => {
  it('lists this product and the picks, with the total of what is ticked', async () => {
    const { container } = render(<FrequentlyBought storeId="S1" main={main} settings={{ maxItems: 2 }} tokens={tokens} />);
    await screen.findByText('Cap');
    expect(screen.getByText('Bag')).toBeTruthy();
    const total = () => container.querySelector('strong')?.textContent ?? '';
    expect(total()).toMatch(/60/);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bag' }));
    expect(total()).toMatch(/40/);
  });
  it('adds this product and only the ticked picks to the cart', async () => {
    render(<FrequentlyBought storeId="S1" main={main} settings={{}} tokens={tokens} />);
    await screen.findByText('Cap');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bag' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add selected to cart' }));
    await waitFor(() => expect(added).toHaveLength(2));
    expect(added.map(a => a[0])).toEqual(['P1', 'P2']);
    expect(added[1]).toEqual(['P2', 'v2', 'physical', 1]);
  });
  it('the current product cannot be unticked', async () => {
    render(<FrequentlyBought storeId="S1" main={main} settings={{}} tokens={tokens} />);
    await screen.findByText('Cap');
    expect((screen.getByRole('checkbox', { name: 'Tee' }) as HTMLInputElement).disabled).toBe(true);
  });
  it('draws nothing when the product cannot be bought', async () => {
    const { container } = render(<FrequentlyBought storeId="S1" main={{ ...main, canBuy: false }} settings={{}} tokens={tokens} />);
    await new Promise(r => setTimeout(r, 20));
    expect(container.querySelector('[data-fbt]')).toBeNull();
  });
});
