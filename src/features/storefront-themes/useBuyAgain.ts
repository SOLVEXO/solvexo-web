import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAddToCart, apiUpdateCartQuantity } from '@/api/services/cart';
import type { OrderDetail } from '@/api/services/orders';
import { useCartContext } from '@/contexts/CartContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { isDigitalItem } from './orderUi';

export interface BuyAgainResult { added: number; errors: string[]; skippedDigital: number }

/** "Buy again": re-adds every non-cancelled physical line of an order to the
 *  cart through the same API the product page uses (one unit, then +1 per
 *  extra unit). Per-item failures are reported, never swallowed. Navigates to
 *  /cart only when something was added and nothing failed. */
export function useBuyAgain() {
  const { store } = useStorefront();
  const { refetch } = useCartContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BuyAgainResult | null>(null);

  const run = useCallback(async (order: OrderDetail) => {
    setBusy(true);
    setResult(null);
    let added = 0;
    let skippedDigital = 0;
    const errors: string[] = [];
    const items = (order.sellerOrders ?? []).flatMap(s => s.items ?? []).filter(i => i.status !== 'cancelled');
    for (const item of items) {
      if (isDigitalItem(item)) { skippedDigital += 1; continue; }
      if (!item.productId || !item.variantId) { errors.push(`${item.name}: no longer available`); continue; }
      try {
        await apiAddToCart(item.productId, item.variantId, store.storeId);
        for (let i = 1; i < item.quantity; i++) {
          await apiUpdateCartQuantity(item.productId, item.variantId, 'increase', store.storeId);
        }
        added += 1;
      } catch (err) {
        errors.push(`${item.name}: ${err instanceof Error ? err.message : 'could not be added'}`);
      }
    }
    refetch();
    setResult({ added, errors, skippedDigital });
    setBusy(false);
    if (added > 0 && errors.length === 0) navigate('/cart');
  }, [store.storeId, refetch, navigate]);

  return { run, busy, result };
}
