import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { dropSsr, putSsr } from '@/utils/ssrData';

const getProducts = vi.fn();
vi.mock('@/api/services/store', () => ({ apiGetPublicStoreProducts: (...a: unknown[]) => getProducts(...a) }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 'S1' } }) }));
vi.mock('./productContext', () => ({ useProductPage: () => ({ productId: 'P0', categoryId: 'CAT', subCategoryId: null, complementaryProductIds: ['A', 'B'] }) }));
import { useRecommendedProducts } from './useRecommendedProducts';

const rows = (ids: string[]) => ({ data: { products: ids.map(_id => ({ _id })) } });

beforeEach(() => { getProducts.mockClear(); });
afterEach(() => { cleanup(); dropSsr(); });

describe('useRecommendedProducts', () => {
  it('related: loads the category, leaves out the viewed product and keeps at most `limit`', async () => {
    getProducts.mockResolvedValue(rows(['P0', 'x1', 'x2', 'x3', 'x4', 'x5']));
    const { result } = renderHook(() => useRecommendedProducts({ source: 'related', limit: 3 }));
    expect(result.current.items).toBeNull();
    await waitFor(() => expect(result.current.items?.map(p => p._id)).toEqual(['x1', 'x2', 'x3']));
    expect(getProducts).toHaveBeenCalledWith('S1', { categoryId: 'CAT', limit: 4, sort: 'best_selling' });
  });

  it('complementary: asks for the products the seller picked', async () => {
    getProducts.mockResolvedValue(rows(['A', 'B']));
    const { result } = renderHook(() => useRecommendedProducts({ source: 'complementary' }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(getProducts).toHaveBeenCalledWith('S1', { ids: ['A', 'B'], limit: 2 });
  });

  it('manual with nothing picked is an empty list, not a request', async () => {
    const { result } = renderHook(() => useRecommendedProducts({ source: 'manual', productIds: [] }));
    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(getProducts).not.toHaveBeenCalled();
  });

  it('a failed request becomes an empty list', async () => {
    getProducts.mockImplementation(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => useRecommendedProducts({ source: 'category', categoryId: 'C1' }));
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('uses server-rendered products on the first render and makes no request', async () => {
    const key = `recs:S1:${JSON.stringify(['related', 'P0', 'CAT', '', 3, '', '', ''])}`;
    putSsr(key, [{ _id: 's1' }, { _id: 's2' }]);
    const { result } = renderHook(() => useRecommendedProducts({ source: 'related', limit: 3 }));
    expect(result.current.items?.map(p => p._id)).toEqual(['s1', 's2']);
    await new Promise(r => setTimeout(r, 30));
    expect(getProducts).not.toHaveBeenCalled();
  });
});
