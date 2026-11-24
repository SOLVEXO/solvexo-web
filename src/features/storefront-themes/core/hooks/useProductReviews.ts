import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetProductReviews, type ProductReviewEntry, type ProductReviewStats } from '@/api/services/rating';
import { dropSsr, peekSsr, wantSsr } from '@/utils/ssrData';

export interface ProductReviewsData { stats: ProductReviewStats; reviews: ProductReviewEntry[] }

/** Key under which a server-rendered page carries a product's first page of reviews. */
export function reviewsSsrKey(productId: string, limit: number): string {
  return `reviews:${productId}:${limit}`;
}

/**
 * The most helpful reviews of a product (and their rating summary), with a `refetch` for after the shopper writes one.
 * A server-rendered page carries them, so the rating and the review texts are already in the first HTML and the browser's first
 * render makes no request; otherwise they load in an effect as before. A failed load simply shows no reviews.
 */
export function useProductReviews(productId: string | undefined, limit: number): { reviews: ProductReviewsData | null; refetch: () => void } {
  const ssrKey = productId ? reviewsSsrKey(productId, limit) : undefined;
  const [seeded] = useState(() => peekSsr<ProductReviewsData>(ssrKey));
  const skipFirst = useRef(seeded !== undefined);
  const [reviews, setReviews] = useState<ProductReviewsData | null>(seeded ?? null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(n => n + 1), []);

  // Server collecting pass: ask for the reviews once the product is known (no effect runs on the server).
  if (seeded === undefined && productId) {
    wantSsr(ssrKey, () => apiGetProductReviews(productId, { limit, sort: 'most_helpful' }).then(r => ({ stats: r.data.stats, reviews: r.data.reviews })));
  }

  useEffect(() => {
    if (!productId) return;
    if (skipFirst.current) { skipFirst.current = false; if (ssrKey) dropSsr(ssrKey); return; }
    let off = false;
    apiGetProductReviews(productId, { limit, sort: 'most_helpful' })
      .then(r => { if (!off) setReviews({ stats: r.data.stats, reviews: r.data.reviews }); })
      .catch(() => {});
    return () => { off = true; };
  }, [productId, limit, tick, ssrKey]);

  return { reviews, refetch };
}
