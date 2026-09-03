import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, ChevronRight } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCartContext } from '@/contexts/CartContext';
import { apiGetPaymentStatus, type PlacedOrder } from '@/api/services/payment';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t } from '../theme.config';

/** Landing page for a buyer coming BACK from a hosted-checkout redirect
 *  (Safepay et al) — same real, provider-agnostic polling posture as
 *  `AtelierCheckoutReturnPage`: the gateway's own webhook is what actually
 *  finalizes the order server-side, this page never trusts anything in its
 *  own URL/query string as proof of payment, it only polls the same
 *  `apiGetPaymentStatus` `NovaCheckoutPage.handleStripeConfirmed` uses until
 *  that status flips. */
export function NovaCheckoutReturnPage() {
  useStorefrontSeo({ title: 'Confirming your payment', noindex: true });
  const navigate = useNavigate();
  const { store } = useStorefront();
  const { clearCart } = useCartContext();
  const { checkoutId } = useParams<{ checkoutId: string }>();

  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[] | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (!checkoutId) return;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const res = await apiGetPaymentStatus(checkoutId);
        if (stopped) return;
        if (res.data.status === 'completed') {
          setStatus('completed');
          setPlacedOrders(res.data.orders);
          if (!cartCleared.current) { cartCleared.current = true; clearCart().catch(() => {}); }
          return;
        }
        if (res.data.status === 'failed') {
          setStatus('failed');
          return;
        }
      } catch { /* transient — keep polling, same as the Stripe path */ }
      if (!stopped) pollTimer.current = setTimeout(poll, 2000);
    };
    poll();

    const timeout = setTimeout(() => { if (!stopped) setTimedOut(true); }, 45_000);
    return () => { stopped = true; if (pollTimer.current) clearTimeout(pollTimer.current); clearTimeout(timeout); };
  }, [checkoutId, clearCart]);

  if (status === 'completed' && placedOrders) {
    return (
      <div className="mx-auto text-center" style={{ maxWidth: '560px', padding: '72px 20px' }}>
        <div className="flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E1F5EB', marginBottom: '20px' }}>
          <CheckCircle2 size={28} style={{ color: t.colors.success }} />
        </div>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Thank you for your order!</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, marginBottom: '28px' }}>Your payment was confirmed and your order at {store.name} has been placed.</p>
        <div style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, marginBottom: '32px', textAlign: 'left', overflow: 'hidden' }}>
          {placedOrders.map((o, i) => (
            <div key={o.orderId} className="flex justify-between items-center" style={{ padding: '14px 18px', borderTop: i > 0 ? `1.5px solid ${t.colors.border}` : undefined, fontSize: '13px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: t.colors.accent }}>{o.orderNumber}</span>
              <span style={{ fontFamily: t.fonts.body, color: t.colors.inkMuted }}>{currencySymbol(o.currency)}{fmt2(o.summary.total)}</span>
            </div>
          ))}
        </div>
        <NovaButton onClick={() => navigate('/')}>Continue Shopping <ChevronRight size={14} style={{ marginLeft: '4px' }} /></NovaButton>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="mx-auto text-center" style={{ maxWidth: '480px', padding: '72px 20px' }}>
        <div className="flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FBE1DF', marginBottom: '20px' }}>
          <XCircle size={28} style={{ color: t.colors.danger }} />
        </div>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Payment wasn't completed</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, marginBottom: '28px' }}>Nothing was charged — your cart is still here, so you can try again or pick a different payment method.</p>
        <NovaButton onClick={() => navigate('/checkout')}>Back to Checkout</NovaButton>
      </div>
    );
  }

  return (
    <div className="mx-auto text-center" style={{ maxWidth: '480px', padding: '96px 20px' }}>
      <Loader2 size={24} className="animate-spin mx-auto" style={{ color: t.colors.accent, marginBottom: '18px' }} />
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '18px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Confirming your payment…</h1>
      <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted }}>
        {timedOut
          ? "This is taking longer than expected — your payment may still be processing. Check your orders in a few minutes, or contact us if it doesn't show up."
          : "This only takes a moment — please don't close this page."}
      </p>
    </div>
  );
}

export default NovaCheckoutReturnPage;
