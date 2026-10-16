import { useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { isGuestUser } from '@/api/services/auth';
import type { PlacedOrder } from '@/api/services/payment';
import { trackPixelEvent } from '@/utils/trackingPixels';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { ErrorState, Page, PillButton } from '../ui/primitives';
import { isBuyNowCheckout } from '../../core/checkout/buyNowMarker';
import { placedTotal } from '../../core/checkout/checkoutMath';
import { OrderPlaced } from './checkout/OrderPlaced';
import { usePaymentStatus } from '../../core/checkout/usePaymentStatus';

/**
 * `/checkout/:checkoutId/return` - where the buyer lands after a hosted gateway (or a redirect-based card method).
 * Nothing in the URL is trusted as proof of payment: the page only polls the server until the order is finalized.
 */
export function FashionCheckoutReturnPage() {
  const { store } = useStorefront();
  const { clearCart, refetch } = useCartContext();
  const { checkoutId } = useParams<{ checkoutId: string }>();
  // Easypaisa: the buyer approves in their app while this page waits (no redirect to the gateway).
  const [params] = useSearchParams();
  const awaitingWallet = params.get('wallet') === 'easypaisa';
  useStorefrontSeo({ title: 'Confirming your payment', noindex: true });

  const pixelFired = useRef(false);
  const onCompleted = useCallback((orders: PlacedOrder[]) => {
    // A one-line "buy it now" must not empty the rest of the cart.
    if (checkoutId && isBuyNowCheckout(checkoutId)) refetch(); else void clearCart({ silent: true });
    if (pixelFired.current) return;
    pixelFired.current = true;
    const tot = placedTotal(orders);
    trackPixelEvent('Purchase', { value: tot.amount, currency: tot.currency, contentIds: orders.map(o => o.orderId) });
  }, [checkoutId, clearCart, refetch]);

  const poll = usePaymentStatus(checkoutId, { autoStart: true, intervalMs: 2000, timeoutMs: awaitingWallet ? 180_000 : 45_000, onCompleted });

  const finished = poll.status !== 'pending';
  useEffect(() => { if (finished) window.scrollTo({ top: 0 }); }, [finished]);

  if (!checkoutId) {
    return <Page narrow><ErrorState message="This confirmation link is incomplete." onRetry={undefined} /><p className="text-center"><Link to="/cart" style={{ color: t.colors.ink }}>Back to your cart</Link></p></Page>;
  }

  if (poll.status === 'completed') {
    return <OrderPlaced orders={poll.orders} storeName={store.name} guestEmail={isGuestUser() ? '' : null} paymentConfirmed />;
  }

  if (poll.status === 'failed') {
    return (
      <Page narrow>
        <div role="alert" className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${t.colors.danger} 12%, transparent)`, color: t.colors.danger }}><XCircle size={30} aria-hidden /></span>
          <h1 className="m-0 text-[clamp(26px,3.6vw,40px)] font-medium leading-[1.1] tracking-tight">Payment wasn&apos;t <span className="fx-serif">completed</span></h1>
          <p className="m-0 max-w-[440px] text-base" style={{ color: t.colors.inkMuted }}>Nothing was charged for an order - your cart is still here, so you can try again or pick a different payment method.</p>
          <Link to="/checkout" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>Back to checkout</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page narrow>
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 size={30} className="animate-spin" aria-hidden style={{ color: t.colors.ink }} />
        <h1 className="m-0 text-[clamp(24px,3.4vw,36px)] font-medium leading-[1.15] tracking-tight">
          {awaitingWallet && !poll.timedOut ? <>Approve the payment in your <span className="fx-serif">Easypaisa</span> app</> : <>Confirming your <span className="fx-serif">payment</span></>}
        </h1>
        <p className="m-0 max-w-[460px] text-base" style={{ color: t.colors.inkMuted }}>
          {poll.timedOut
            ? "This is taking longer than expected - your payment may still be processing. You will get an email once your order is placed, or check again below."
            : awaitingWallet
              ? 'Open the Easypaisa app on your phone and approve the payment request. Keep this page open - your order is placed as soon as you approve.'
              : "This only takes a moment - please don't close this page."}
        </p>
        {poll.timedOut && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PillButton onClick={poll.start}>Check again</PillButton>
            <Link to="/checkout" className="fx-pill" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink, borderRadius: t.buttonRadiusPx }}>Back to checkout</Link>
          </div>
        )}
      </div>
    </Page>
  );
}

export default FashionCheckoutReturnPage;
