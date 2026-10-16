import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { localePath } from '@/i18n';
import type { Checkout } from '@/api/services/checkout';
import { apiInitiatePayment } from '@/api/services/payment';
import { apiGetCheckoutPaymentMethods, type PublicPaymentMethod } from '@/api/services/integrations';
import { goToGateway } from '@/utils/gatewayRedirect';
import { useLoad } from '../pageHooks';
import { initiateGatewayOnce, placeCodOrderOnce, placeManualOrderOnce, type PlacedLike } from './checkoutApi';
import { isStaleCheckoutError, newAttemptKey } from './checkoutMath';
import { buildPayOptions, resolveSelected, type PayOption } from './payOptions';
import { isStripeReady } from './stripeLoader';
import type { CardOrCod } from './useCheckoutCreation';
import { usePaymentStatus } from './usePaymentStatus';

interface Args {
  checkout: Checkout | null;
  allowed: CardOrCod[];
  /** Store credit covers the whole total (placed through the store-credit endpoint instead). */
  creditCoversAll: boolean;
  /** Called exactly once when an order is placed / payment is confirmed. */
  onOrdersPlaced: (orders: PlacedLike[]) => void;
  /** The buyer committed to paying (card confirmed / leaving for a gateway) - used for the marketing opt-in. */
  onCommit: () => void;
}

export interface PayError { message: string; stale: boolean }

/** Everything between "checkout exists" and "order placed": method list, card session, COD / manual / gateway placement. */
export function useCheckoutPayment({ checkout, allowed, creditCoversAll, onOrdersPlaced, onCommit }: Args) {
  const navigate = useNavigate();
  const checkoutId = checkout?._id;
  const total = checkout?.totalAmount ?? 0;

  const extrasQ = useLoad<PublicPaymentMethod[]>(
    () => (checkoutId ? apiGetCheckoutPaymentMethods(checkoutId).then(r => r.data ?? []) : Promise.resolve([])),
    [checkoutId],
  );
  const options = useMemo(
    () => buildPayOptions({ allowed, extras: extrasQ.data ?? [], stripeConfigured: isStripeReady(), zeroTotal: !!checkout && total <= 0 && !creditCoversAll }),
    [allowed, extrasQ.data, checkout, total, creditCoversAll],
  );
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const selected: PayOption | null = resolveSelected(options, chosenKey);
  const [walletAccount, setWalletAccount] = useState('');

  // --- card: one PaymentIntent session per (checkout, total); any change in the total makes the old one stale. ---
  const [cardTick, setCardTick] = useState(0);
  const wantCard = selected?.kind === 'stripe' && !!checkoutId && !creditCoversAll && total > 0;
  const cardKey = wantCard ? `${checkoutId}|${total}|${cardTick}` : null;
  const [card, setCard] = useState<{ key: string; secret?: string; amount?: number; error?: string } | null>(null);
  useEffect(() => {
    if (!cardKey || !checkoutId) return;
    apiInitiatePayment({ checkoutId, paymentMode: 'full' })
      .then(res => setCard({ key: cardKey, secret: res.data.clientSecret, amount: res.data.amount }))
      .catch(err => setCard({ key: cardKey, error: err instanceof Error ? err.message : 'Failed to start card payment.' }));
  }, [cardKey, checkoutId]);
  const cardView = !cardKey ? null : card && card.key === cardKey ? card : null;
  const cardLoading = !!cardKey && !cardView;

  // --- confirmation polling after Stripe confirms client-side ---
  const poll = usePaymentStatus(checkoutId, { autoStart: false, intervalMs: 1500, timeoutMs: 45_000, onCompleted: orders => onOrdersPlaced(orders) });

  // --- placement actions: one at a time, each attempt carries its own idempotency key ---
  const lock = useRef(false);
  const keys = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<PayError | null>(null);

  useEffect(() => {
    // Back from a hosted gateway page via the browser's back button: the page is restored as it was, so unlock it.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) { lock.current = false; setBusy(false); setRedirecting(false); } };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const fail = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof Error && err.message ? err.message : fallback;
    setError({ message, stale: isStaleCheckoutError(message) });
  }, []);

  const attemptKey = (name: string): string => {
    const have = keys.current[name];
    if (have && checkoutId && have.includes(checkoutId)) return have;
    return (keys.current[name] = newAttemptKey(name, checkoutId ?? 'x'));
  };

  /** Set when the browser is about to leave the page (gateway redirect): the lock must then stay on. */
  const staysLocked = useRef(false);
  const guarded = async (name: string, fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; staysLocked.current = false; setBusy(true); setError(null);
    try { await fn(); }
    catch (err) { delete keys.current[name]; fail(err, 'Something went wrong. Please try again.'); }
    finally { if (!staysLocked.current) { lock.current = false; setBusy(false); } }
  };

  const placeCod = () => guarded('cod', async () => {
    if (!checkoutId) return;
    const res = await placeCodOrderOnce(checkoutId, attemptKey('cod'));
    onOrdersPlaced(res.data.orders);
  });

  const placeManual = (methodId: string) => guarded(`manual-${methodId}`, async () => {
    if (!checkoutId) return;
    const res = await placeManualOrderOnce(checkoutId, methodId, attemptKey(`manual-${methodId}`));
    // The manual-method response carries no payment info: the order is unpaid until the store receives the money.
    onOrdersPlaced(res.data.orders.map(o => ({ ...o, isPaid: false, paymentMethod: 'manual' })));
  });

  /** Hands off to the gateway's own hosted page; the real order is created server-side when the gateway confirms. */
  const payWithGateway = (provider: string) => guarded(`gw-${provider}`, async () => {
    if (!checkoutId) return;
    const returnUrl = `${window.location.origin}${localePath(`/checkout/${checkoutId}/return`)}`;
    const cancelUrl = `${window.location.origin}${localePath('/checkout')}`;
    const wallet = provider === 'easypaisa' ? walletAccount.trim() || undefined : undefined;
    const res = await initiateGatewayOnce(checkoutId, provider, returnUrl, cancelUrl, wallet, attemptKey(`gw-${provider}`));
    if (res.data.redirectUrl) {
      onCommit();
      staysLocked.current = true; // the browser is leaving this page
      setRedirecting(true);
      goToGateway(res.data.redirectUrl, res.data.formFields);
      return;
    }
    if (provider === 'easypaisa' && res.data.sessionId) {
      // Push-approval wallet: no redirect, the buyer approves in their app while the return page waits.
      onCommit();
      staysLocked.current = true;
      navigate(`/checkout/${checkoutId}/return?wallet=easypaisa`);
      return;
    }
    throw new Error('This payment method could not be started.');
  });

  const { start: startPolling, reset: resetPolling } = poll;
  const onCardConfirmed = useCallback(() => { setError(null); onCommit(); startPolling(); }, [startPolling, onCommit]);
  const retryCard = useCallback(() => { resetPolling(); setCard(null); setCardTick(n => n + 1); }, [resetPolling]);

  return {
    options, selected, choose: setChosenKey,
    extrasLoading: extrasQ.loading, extrasError: extrasQ.error, retryExtras: extrasQ.retry,
    walletAccount, setWalletAccount,
    card: { loading: cardLoading, secret: cardView?.secret ?? null, amount: cardView?.amount ?? null, error: cardView?.error ?? null },
    onCardConfirmed, retryCard, poll,
    busy: busy || redirecting, redirecting, error, clearError: () => setError(null), reportError: fail,
    placeCod, placeManual, payWithGateway,
  };
}
