import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { dropSsr, putSsr } from '@/utils/ssrData';

const getTree = vi.fn();
vi.mock('@/api/services/categories', () => ({ apiGetStoreCategoryTree: (...a: unknown[]) => getTree(...a) }));
import { categoryTreeSsrKey, useStoreCategoryTree } from './useStoreCategoryTree';

beforeEach(() => getTree.mockReset());
afterEach(() => { cleanup(); dropSsr(); });

describe('useStoreCategoryTree with server-rendered data', () => {
  it('loads the tree when there is no seed', async () => {
    getTree.mockResolvedValue({ data: [{ _id: 'c1', name: 'Shoes' }] });
    const { result } = renderHook(() => useStoreCategoryTree('S1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.tree).toHaveLength(1));
    expect(getTree).toHaveBeenCalledTimes(1);
  });

  it('shows a seeded tree on the very first render and makes no request', async () => {
    putSsr(categoryTreeSsrKey('S1'), [{ _id: 'c1', name: 'Shoes' }, { _id: 'c2', name: 'Bags' }]);
    const { result } = renderHook(() => useStoreCategoryTree('S1'));
    expect(result.current.loading).toBe(false);
    expect(result.current.tree.map(c => c.name)).toEqual(['Shoes', 'Bags']);
    await new Promise(r => setTimeout(r, 30));
    expect(getTree).not.toHaveBeenCalled();
  });

  it('keeps hidden and public trees apart', () => {
    expect(categoryTreeSsrKey('S1', true)).not.toBe(categoryTreeSsrKey('S1', false));
  });

  it('refetch loads fresh data after a seed was used', async () => {
    putSsr(categoryTreeSsrKey('S1'), [{ _id: 'c1', name: 'Old' }]);
    getTree.mockResolvedValue({ data: [{ _id: 'c9', name: 'New' }] });
    const { result } = renderHook(() => useStoreCategoryTree('S1'));
    await new Promise(r => setTimeout(r, 20));
    result.current.refetch();
    await waitFor(() => expect(result.current.tree[0]?.name).toBe('New'));
  });
});
