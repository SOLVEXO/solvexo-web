import { useEffect, useMemo, useState } from 'react';
import { apiGetMyOrders } from '@/api/services/orders';
import { TokenStorage, isGuestUser } from '@/api/services/auth';

export interface PendingReview {
  productId: string;
  variantId?: string;
  name: string;
  image: string | null;
  orderId: string;
  orderNumber: string;
}

const DELIVERED = ['delivered', 'completed'];

/** Delivered products the buyer has not reviewed yet (newest orders first, one entry per product), built from the
 *  buyer's recent orders. `reviewedProductIds` comes from `useReviewedProducts`. `loading` is true until the orders arrived. */
export function usePendingReviews(reviewedProductIds: ReadonlySet<string>): { pending: PendingReview[]; loading: boolean } {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof apiGetMyOrders>>['data']['orders'] | null>(null);

  useEffect(() => {
    if (!TokenStorage.isLoggedIn() || isGuestUser()) return;
    let off = false;
    apiGetMyOrders({ page: 1, limit: 50 })
      .then(res => { if (!off) setOrders(res.data.orders ?? []); })
      .catch(() => { if (!off) setOrders([]); });
    return () => { off = true; };
  }, []);

  const pending = useMemo(() => {
    const seen = new Set<string>();
    const out: PendingReview[] = [];
    for (const o of orders ?? []) {
      for (const group of o.stores ?? []) {
        for (const item of group.items ?? []) {
          if (!DELIVERED.includes(String(item.status)) || !item.productId) continue;
          if (reviewedProductIds.has(item.productId) || seen.has(item.productId)) continue;
          seen.add(item.productId);
          out.push({ productId: item.productId, variantId: item.variantId, name: item.name, image: item.image ?? null, orderId: o.orderId, orderNumber: o.orderNumber });
        }
      }
    }
    return out;
  }, [orders, reviewedProductIds]);

  return { pending, loading: orders === null && TokenStorage.isLoggedIn() && !isGuestUser() };
}
