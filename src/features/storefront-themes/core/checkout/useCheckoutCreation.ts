import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  apiAddShippingToCheckout, apiCreateCheckout, type Checkout, type CheckoutSummary, type ShippingSelectionPayload,
} from '@/api/services/checkout';

export type CardOrCod = 'stripe' | 'cash_on_delivery';

export interface LiveCheckout {
  /** `${wantKey}#${attempt}` this checkout was created for. */
  key: string;
  checkout: Checkout;
  summary: CheckoutSummary;
  allowed: CardOrCod[];
}

export interface CreationInput {
  storeId: string;
  /** All required buyer input is present (contact, address / pickup, shipping rate). */
  ready: boolean;
  isDigital: boolean;
  pickup: boolean;
  addressId: string | null;
  multiGroup: boolean;
  selections: ShippingSelectionPayload[];
  /** Single-rate choice: id + whether it is a live carrier rate. */
  rateId: string | null;
  rateIsLive: boolean;
  /** Changes whenever any of the choices above change in a way that needs a new checkout. */
  choiceKey: string;
  buyNow: { productId: string; variantId: string } | null;
  cartSig: string;
  guest: boolean;
  commitGuest: () => Promise<boolean>;
  /** The currency the server resolved for this checkout (delivery prices are then listed in it). */
  onCurrency?: (currency: string) => void;
}

/**
 * Creates the backend checkout once everything it needs is chosen, then registers the shipping rate (create always
 * starts at a zero shipping fee). Everything is keyed, so a changed address / rate / cart simply produces a new
 * checkout and the old result is ignored - no synchronous resets, no stale state. `restart` makes a fresh checkout
 * (used when the old one expired or was completed).
 */
export function useCheckoutCreation(input: CreationInput) {
  const wantKey = input.ready ? JSON.stringify([input.storeId, input.cartSig, input.choiceKey, input.buyNow, input.guest]) : null;
  const [attempt, setAttempt] = useState(0);
  const runKey = wantKey === null ? null : `${wantKey}#${attempt}`;
  const [live, setLive] = useState<LiveCheckout | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; });
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!runKey) return;
    if (startedRef.current === runKey) return;
    startedRef.current = runKey;
    const p = inputRef.current;
    void (async () => {
      try {
        // A guest's email must reach the backend BEFORE any payment can start (the confirmation goes there).
        if (p.guest && !(await p.commitGuest())) throw new Error('Enter a valid email address to continue.');
        const res = await apiCreateCheckout({
          addressId: p.isDigital || p.pickup ? undefined : (p.addressId ?? undefined),
          ...(p.multiGroup && !p.isDigital
            ? { selections: p.selections }
            : { shippingZoneId: p.isDigital || p.rateIsLive ? undefined : (p.rateId ?? undefined) }),
          storeId: p.storeId,
          ...(p.buyNow ? { items: [p.buyNow] } : {}),
        });
        let checkout = res.data.checkout;
        let summary = res.data.summary;
        const methods = (res.data.allowedPaymentMethods ?? []).filter((m): m is CardOrCod => m === 'stripe' || m === 'cash_on_delivery');
        if (!p.isDigital) {
          // Without the shipping fee the total is wrong, so a failure here fails the whole creation.
          const ship = await apiAddShippingToCheckout({
            checkoutId: checkout._id,
            ...(p.multiGroup ? { selections: p.selections } : p.rateIsLive ? { liveRateId: p.rateId ?? undefined } : { shippingZoneId: p.rateId ?? undefined }),
          });
          const d = ship.data;
          checkout = {
            ...checkout,
            shippingFee: d.shippingFee,
            totalAmount: d.totalAmount,
            taxAmount: d.taxAmount ?? checkout.taxAmount,
            subtotal: Number.isFinite(d.subtotal) ? d.subtotal : checkout.subtotal,
          };
          summary = {
            ...summary,
            shippingFee: d.shippingFee, totalAmount: d.totalAmount, taxAmount: d.taxAmount ?? summary.taxAmount,
            includedTaxAmount: d.includedTaxAmount ?? summary.includedTaxAmount, internationalDutiesNotice: d.internationalDutiesNotice,
          };
        }
        p.onCurrency?.(checkout.currency);
        setLive({ key: runKey, checkout, summary, allowed: p.isDigital ? methods.filter(m => m === 'stripe') : methods });
      } catch (err) {
        setFailure({ key: runKey, message: err instanceof Error ? err.message : 'Failed to start checkout.' });
      }
    })();
  }, [runKey]);

  const current = live && live.key === runKey ? live : null;
  const error = failure && failure.key === runKey ? failure.message : null;
  const creating = !!runKey && !current && !error;

  /** Applies an update to the live checkout (coupon / gift card / store credit responses). */
  const setCheckout: Dispatch<SetStateAction<Checkout | null>> = useCallback(action => {
    setLive(l => {
      if (!l) return l;
      const next = typeof action === 'function' ? action(l.checkout) : action;
      return next ? { ...l, checkout: next } : l;
    });
  }, []);

  const restart = useCallback(() => setAttempt(n => n + 1), []);

  return { checkout: current?.checkout ?? null, summary: current?.summary ?? null, allowed: current?.allowed ?? [], creating, error, restart, setCheckout };
}
