import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { apiApplyStoreCredit, apiRemoveStoreCredit, type Checkout, type ApplyStoreCreditData } from '@/api/services/checkout';
import { apiStoreCreditPayment, type PlacedOrder } from '@/api/services/payment';
import { apiGetMyStoreCredit } from '@/api/services/storeCredit';
import { currencySymbol, fmt2 } from '@/utils/currency';

interface Options {
  storeId: string | undefined;
  checkout: Checkout | null;
  setCheckout: Dispatch<SetStateAction<Checkout | null>>;
  loggedIn: boolean;
  /** Called whenever the applied credit (and so the charge amount) changed —
   *  themes use it to drop a stale Stripe client secret. */
  onTotalChanged?: () => void;
}

/** Shared by both themes' checkout pages — Shopify-style store credit at
 *  checkout (balance lookup, apply/remove, and the "credit covers the whole
 *  total" place-order call). Single-store checkouts only. */
export function useStoreCredit({ storeId, checkout, setCheckout, loggedIn, onTotalChanged }: Options) {
  // Keyed by checkout id so a stale balance never shows for a new checkout.
  const [fetched, setFetched] = useState<{ checkoutId: string; balance: number; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const placeKeyRef = useRef<string | null>(null);

  const checkoutId = checkout?._id;
  const singleStore = !!checkout && !!storeId && checkout.items.every(i => !i.storeId || i.storeId === storeId);

  useEffect(() => {
    if (!loggedIn || !checkoutId || !storeId || !singleStore) return;
    let cancelled = false;
    apiGetMyStoreCredit(storeId)
      .then(res => {
        if (cancelled) return;
        setFetched({ checkoutId, balance: res.data?.balance ?? 0, currency: res.data?.currency ?? 'USD' });
      })
      .catch(() => { /* no balance -> the optional store-credit row simply stays hidden */ });
    return () => { cancelled = true; };
  }, [loggedIn, checkoutId, storeId, singleStore]);

  const current = fetched && fetched.checkoutId === checkoutId ? fetched : null;
  const balance = current?.balance ?? 0;
  const balanceCurrency = current?.currency ?? 'USD';

  const absorb = useCallback((data: ApplyStoreCreditData) => {
    setCheckout(c => c && {
      ...c,
      storeCreditApplied: data.storeCreditApplied,
      storeCreditDiscountTotalUSD: data.storeCreditDiscountUSD,
      totalAmount: data.totalAmount,
    });
    onTotalChanged?.();
  }, [setCheckout, onTotalChanged]);

  const apply = async () => {
    if (!checkout) return;
    setBusy(true); setMsg('');
    try {
      const res = await apiApplyStoreCredit(checkout._id);
      absorb(res.data);
      setMsg(res.data.storeCreditApplied
        ? `Applied — ${currencySymbol(checkout.currency)}${fmt2(res.data.storeCreditDiscountUSD)} used.`
        : 'Store credit could not be applied to this order.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not apply store credit.');
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!checkout) return;
    setBusy(true); setMsg('');
    try {
      const res = await apiRemoveStoreCredit(checkout._id);
      absorb(res.data);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not remove store credit.');
    } finally { setBusy(false); }
  };

  /** Call after a coupon/gift-card change: the credit layer is outermost on the
   *  backend, so an applied credit amount may have been re-settled. */
  const resync = async () => {
    if (!checkout?.storeCreditApplied) return;
    try {
      const res = await apiApplyStoreCredit(checkout._id);
      absorb(res.data);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not refresh store credit.');
    }
  };

  /** Places the order when credit covers the whole total. Returns the placed
   *  orders, or null on failure (error is exposed as `placeError`). */
  const place = async (): Promise<PlacedOrder[] | null> => {
    if (!checkout) return null;
    setPlacing(true); setPlaceError('');
    if (!placeKeyRef.current) placeKeyRef.current = `store-credit-${checkout._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await apiStoreCreditPayment({ checkoutId: checkout._id }, placeKeyRef.current);
      return res.data.orders;
    } catch (err) {
      placeKeyRef.current = null; // a failed attempt must not replay on retry
      setPlaceError(err instanceof Error ? err.message : 'Failed to place order.');
      return null;
    } finally { setPlacing(false); }
  };

  return { balance, balanceCurrency, busy, msg, apply, remove, resync, place, placing, placeError, available: balance > 0 || !!checkout?.storeCreditApplied };
}
