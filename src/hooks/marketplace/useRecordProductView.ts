import { useEffect } from 'react';
import { apiRecordProductView } from '@/api/services/productViews';

/**
 * Phase 5 — Product Tracking Foundation. Fires the view beacon once per
 * mounted product detail page. Fire-and-forget: the backend's own dedup
 * window (see ProductViewsService) is what keeps a refresh/re-render from
 * inflating the count, so this hook does not need its own guard beyond
 * "once per id" — and a failure here must never surface to the buyer, since
 * a tracking beacon is not part of the page actually working.
 */
export function useRecordProductView(productId: string | undefined | null) {
  useEffect(() => {
    if (!productId) return;
    apiRecordProductView(productId).catch(() => undefined);
  }, [productId]);
}
