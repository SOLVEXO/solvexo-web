import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { dropSsr, putSsr } from '@/utils/ssrData';

const getCollections = vi.fn();
const listPages = vi.fn();
vi.mock('@/api/services/collections', () => ({ apiGetPublicCollections: (...a: unknown[]) => getCollections(...a) }));
vi.mock('@/api/services/storePages', () => ({ apiListPublicStorePages: (...a: unknown[]) => listPages(...a) }));
import { usePublicCollections, usePublicCollectionsOrNull, usePublicPages } from './usePublicLists';

beforeEach(() => { getCollections.mockReset(); listPages.mockReset(); });
afterEach(() => { cleanup(); dropSsr(); });

describe('usePublicCollections / usePublicPages', () => {
  it('start empty, then show what the server answers', async () => {
    getCollections.mockResolvedValue({ data: [{ _id: 'c1', name: 'Summer' }] });
    const { result } = renderHook(() => usePublicCollections('S1'));
    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(getCollections).toHaveBeenCalledTimes(1);
  });

  it('use server-rendered data on the first render and make no request', async () => {
    putSsr('collections:S1', [{ _id: 'c1', name: 'Summer' }, { _id: 'c2', name: 'Winter' }]);
    putSsr('pages:S1', [{ _id: 'p1', slug: 'about' }]);
    const a = renderHook(() => usePublicCollections('S1'));
    const b = renderHook(() => usePublicPages('S1'));
    expect(a.result.current.map(c => c.name)).toEqual(['Summer', 'Winter']);
    expect(b.result.current).toHaveLength(1);
    await new Promise(r => setTimeout(r, 30));
    expect(getCollections).not.toHaveBeenCalled();
    expect(listPages).not.toHaveBeenCalled();
  });

  it('a failed load keeps the empty list', async () => {
    listPages.mockImplementation(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => usePublicPages('S1'));
    await new Promise(r => setTimeout(r, 30));
    expect(result.current).toEqual([]);
  });
});

describe('usePublicCollectionsOrNull', () => {
  it('is null while loading and an empty list when loading fails', async () => {
    getCollections.mockImplementation(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => usePublicCollectionsOrNull('S1'));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual([]));
  });
});
