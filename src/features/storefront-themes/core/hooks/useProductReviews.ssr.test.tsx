import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import { dropSsr, putSsr } from '@/utils/ssrData';

const getReviews = vi.fn();
vi.mock('@/api/services/rating', () => ({ apiGetProductReviews: (...a: unknown[]) => getReviews(...a) }));
import { reviewsSsrKey, useProductReviews } from './useProductReviews';

const answer = (n: number) => ({ data: { stats: { averageRating: 4.5, totalReviews: n, ratingBreakdown: {} }, reviews: Array.from({ length: n }, (_, i) => ({ _id: `r${i}` })) } });

beforeEach(() => getReviews.mockReset());
afterEach(() => { cleanup(); dropSsr(); });

describe('useProductReviews', () => {
  it('does nothing without a product, then loads the reviews', async () => {
    getReviews.mockResolvedValue(answer(2));
    const { result, rerender } = renderHook(({ id }: { id?: string }) => useProductReviews(id, 5), { initialProps: { id: undefined } as { id?: string } });
    expect(result.current.reviews).toBeNull();
    expect(getReviews).not.toHaveBeenCalled();
    rerender({ id: 'P1' });
    await waitFor(() => expect(result.current.reviews?.reviews).toHaveLength(2));
    expect(getReviews).toHaveBeenCalledWith('P1', { limit: 5, sort: 'most_helpful' });
  });

  it('shows server-rendered reviews on the first render without a request, and refetch loads fresh ones', async () => {
    putSsr(reviewsSsrKey('P1', 5), { stats: { averageRating: 5, totalReviews: 1, ratingBreakdown: {} }, reviews: [{ _id: 'old' }] });
    getReviews.mockResolvedValue(answer(3));
    const { result } = renderHook(() => useProductReviews('P1', 5));
    expect(result.current.reviews?.reviews).toHaveLength(1);
    await new Promise(r => setTimeout(r, 30));
    expect(getReviews).not.toHaveBeenCalled();
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.reviews?.reviews).toHaveLength(3));
  });

  it('keeps different page sizes apart', () => {
    expect(reviewsSsrKey('P1', 5)).not.toBe(reviewsSsrKey('P1', 10));
  });
});
