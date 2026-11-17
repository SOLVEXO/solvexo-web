import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const cfg = { filters: [{ key: 'price', enabled: true }, { key: 'tags', enabled: false }], sorts: [{ key: 'newest', enabled: true }], showCounts: false };
const get = vi.fn();
vi.mock('@/api/services/searchConfig', () => ({ apiGetPublicSearchConfig: (id: string) => get(id) }));
vi.mock('@/features/storefront/StorefrontContext', () => ({ useStorefront: () => ({ store: { storeId: 'S1' } }) }));
import { resetBrowseConfigCache, useBrowseConfig } from './useBrowseConfig';

beforeEach(() => { resetBrowseConfigCache(); get.mockReset(); });

describe('useBrowseConfig', () => {
  it('shows everything until the server answers, then applies the seller settings (the answer is the settings object itself)', async () => {
    get.mockResolvedValue(cfg);
    const { result } = renderHook(() => useBrowseConfig());
    expect(result.current).toEqual({ showCounts: true });
    await waitFor(() => expect(result.current.showCounts).toBe(false));
    expect(result.current.filters).toEqual(cfg.filters);
    expect(get).toHaveBeenCalledTimes(1);
  });
  it('a failed request keeps the defaults', async () => {
    get.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useBrowseConfig());
    await new Promise(r => setTimeout(r, 30));
    expect(result.current).toEqual({ showCounts: true });
  });
});
