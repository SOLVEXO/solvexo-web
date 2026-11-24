import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { dropSsr, putSsr } from '@/utils/ssrData';

const getProducts = vi.fn();
vi.mock('@/api/services/store', () => ({ apiGetPublicStoreProducts: (...a: unknown[]) => getProducts(...a) }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 'S1', baseCurrency: 'USD' } }) }));
vi.mock('@/contexts/CurrencyPreferenceContext', () => ({ useCurrencyPreference: () => ({ currency: 'USD', convert: (n: number) => n }) }));
vi.mock('@/features/storefront/storefrontMarket', () => ({ useStorefrontMarketOptional: () => null }));
import { browseSsrKey, useProductBrowse } from './useProductBrowse';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const answer = (n: number) => ({ data: { products: Array.from({ length: n }, (_, i) => ({ _id: `p${i}` })), pagination: { total: n, totalPages: 1 }, facets: null } });

beforeEach(() => getProducts.mockReset());
afterEach(() => { cleanup(); dropSsr(); });

describe('useProductBrowse with server-rendered data', () => {
  it('without a seed it loads the listing', async () => {
    getProducts.mockResolvedValue(answer(2));
    const { result } = renderHook(() => useProductBrowse({ syncUrl: true, collectionId: 'C1' }), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.products?.length).toBe(2));
    expect(getProducts).toHaveBeenCalledTimes(1);
  });

  it('with a seed the first render already has the products and no request is made', async () => {
    putSsr(browseSsrKey('S1', { collectionId: 'C1' }), { products: [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }], total: 3, totalPages: 1, facets: null });
    getProducts.mockResolvedValue(answer(9));
    const { result } = renderHook(() => useProductBrowse({ syncUrl: true, collectionId: 'C1' }), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.products?.map(p => p._id)).toEqual(['a', 'b', 'c']);
    expect(result.current.total).toBe(3);
    await new Promise(r => setTimeout(r, 30));
    expect(getProducts).not.toHaveBeenCalled();
    expect(result.current.products?.length).toBe(3);
  });

  it('a seed for another listing is not used', async () => {
    putSsr(browseSsrKey('S1', { collectionId: 'OTHER' }), { products: [{ _id: 'x' }], total: 1, totalPages: 1, facets: null });
    getProducts.mockResolvedValue(answer(2));
    const { result } = renderHook(() => useProductBrowse({ syncUrl: true, collectionId: 'C1' }), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.products?.length).toBe(2));
  });

  it('a listing with its own filters in the address ignores the seed', async () => {
    putSsr(browseSsrKey('S1', { collectionId: 'C1' }), { products: [{ _id: 'a' }], total: 1, totalPages: 1, facets: null });
    getProducts.mockResolvedValue(answer(2));
    const filtered = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/?sort_by=price-ascending']}>{children}</MemoryRouter>;
    const { result } = renderHook(() => useProductBrowse({ syncUrl: true, collectionId: 'C1' }), { wrapper: filtered });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.products?.length).toBe(2));
  });
});

describe('browseSsrKey', () => {
  it('differs by scope, page size and sort', () => {
    const a = browseSsrKey('S1', { collectionId: 'C1' });
    expect(a).not.toBe(browseSsrKey('S1', { collectionId: 'C2' }));
    expect(a).not.toBe(browseSsrKey('S1', { collectionId: 'C1', pageSize: 24 }));
    expect(a).not.toBe(browseSsrKey('S1', { collectionId: 'C1', defaultSort: 'price-ascending' }));
    expect(a).not.toBe(browseSsrKey('S2', { collectionId: 'C1' }));
  });
});
