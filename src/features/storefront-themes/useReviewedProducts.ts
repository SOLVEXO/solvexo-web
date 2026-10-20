import { useCallback, useEffect, useState } from 'react';
import { apiGetMyReviews, type MyReviewEntry } from '@/api/services/rating';
import { TokenStorage, isGuestUser } from '@/api/services/auth';

/** The signed-in buyer's own reviews keyed by product id, so order and product pages can offer
 *  "Write a review" or "Edit your review". Empty for visitors and guest checkouts. */
export function useReviewedProducts(): { byProduct: Map<string, MyReviewEntry>; reload: () => void } {
  const [byProduct, setByProduct] = useState<Map<string, MyReviewEntry>>(new Map());
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    if (!TokenStorage.isLoggedIn() || isGuestUser()) return;
    let off = false;
    (async () => {
      const map = new Map<string, MyReviewEntry>();
      try {
        for (let page = 1; page <= 5; page++) {
          const res = await apiGetMyReviews(page);
          for (const r of res.data.reviews ?? []) if (r.product?.productId) map.set(r.product.productId, r);
          if (page >= (res.data.pagination?.totalPages ?? 1)) break;
        }
      } catch {
        /* the buttons simply fall back to "Write a review" */
      }
      if (!off) setByProduct(map);
    })();
    return () => { off = true; };
  }, [attempt]);

  return { byProduct, reload };
}
