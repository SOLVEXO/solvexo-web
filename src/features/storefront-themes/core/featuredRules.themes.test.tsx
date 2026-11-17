import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Section } from '@/api/services/storefrontTypes';

const getProducts = vi.fn();
vi.mock('@/api/services/store', async importOriginal => {
  const actual = await importOriginal<typeof import('@/api/services/store')>();
  return { ...actual, apiGetPublicStoreProducts: (...a: unknown[]) => getProducts(...a) };
});
vi.mock('@/features/storefront/StorefrontContext', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/storefront/StorefrontContext')>();
  return { ...actual, useStorefront: () => ({ theme: null, store: { storeId: 'S1' }, resolveLink: () => ({}) }) };
});
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD' }) }));
// the product cards need wishlist / cart providers: a plain stand-in is enough to prove which products were asked for
vi.mock('../theme-03-fashion/components/FashionProductCard', () => ({ FashionProductCard: ({ product }: { product: { name: string } }) => <div data-testid="card">{product.name}</div> }));
vi.mock('../theme-04-tech/components/TechProductCard', () => ({ TechProductCard: ({ product }: { product: { name: string } }) => <div data-testid="card">{product.name}</div> }));
vi.mock('../theme-05-ledup/components/LedupProductCard', () => ({ LedupProductCard: ({ product }: { product: { name: string } }) => <div data-testid="card">{product.name}</div> }));

import { FashionSectionRenderer } from '../theme-03-fashion/sections';
import { TechSectionRenderer } from '../theme-04-tech/sections/TechSectionRenderer';
import { LedupSectionRenderer } from '../theme-05-ledup/sections/LedupSectionRenderer';

const section = (settings: Record<string, unknown>): Section => ({ _id: 'f1', type: 'featured_products', settings: { heading: 'Picks', ...settings }, blocks: [] });
const products = [{ _id: 'p1', name: 'Red shoe' }, { _id: 'p2', name: 'Blue shoe' }];

beforeEach(() => {
  getProducts.mockReset();
  getProducts.mockResolvedValue({ data: { products, pagination: { page: 1, limit: 8, total: 2, totalPages: 1 } } });
});
afterEach(cleanup);

const themes = [
  ['Maison', (s: Section[]) => <FashionSectionRenderer sections={s} />],
  ['Tech', (s: Section[]) => <TechSectionRenderer sections={s} />],
  ['Ledup', (s: Section[]) => <LedupSectionRenderer sections={s} />],
] as const;

describe.each(themes)('Featured products with rules: %s', (_name, draw) => {
  it('asks the products API for exactly what the rules say, and draws the result', async () => {
    render(<MemoryRouter>{draw([section({ source: 'rules', limit: 6, ruleTags: ['summer'], ruleVendors: ['Nike'], rulePriceMin: 10, rulePriceMax: 99, ruleStock: 'in_stock', ruleOnSale: true, ruleSort: 'price_desc' })])}</MemoryRouter>);
    await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(2));
    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(getProducts.mock.calls[0][0]).toBe('S1');
    expect(getProducts.mock.calls[0][1]).toEqual({ limit: 6, sort: 'price_desc', tags: ['summer'], vendors: ['Nike'], minPrice: 10, maxPrice: 99, availability: 'in_stock', onSale: true });
  });

  it('an older section is asked for exactly the same thing as before', async () => {
    render(<MemoryRouter>{draw([section({ source: 'bestsellers', limit: 4 })])}</MemoryRouter>);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());
    expect(getProducts.mock.calls[0][1]).toEqual({ limit: 4, sort: 'best_selling' });
  });

  it('"Hide sold-out products" works on any source', async () => {
    render(<MemoryRouter>{draw([section({ source: 'trending', hideSoldOut: true })])}</MemoryRouter>);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());
    expect(getProducts.mock.calls[0][1]).toMatchObject({ sort: 'trending', availability: 'in_stock' });
  });

  it('no matching product: the section is simply not shown', async () => {
    getProducts.mockResolvedValue({ data: { products: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 0 } } });
    const { container } = render(<MemoryRouter>{draw([section({ source: 'rules', ruleTags: ['nothing'] })])}</MemoryRouter>);
    await waitFor(() => expect(getProducts).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Picks')).toBeNull());
    expect(container.querySelector('[data-testid="card"]')).toBeNull();
  });
});
