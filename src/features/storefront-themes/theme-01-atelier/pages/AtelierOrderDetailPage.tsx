import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Package, Loader2, Truck, ArrowLeft } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiGetOrderById, type OrderDetail } from '@/api/services/orders';
import { currencySymbol, fmt2 } from '@/utils/currency';
import {
  derivePaymentBadge, deriveFulfillmentBadge, formatOrderDate, buildOrderTimeline, paymentMethodLabel,
  canRequestReturn, isDigitalItem, safeTrackingUrl, formatShippingAddress, BADGE_TONE_COLOR,
} from '../../orderUi';
import { OrderBadge, OrderDownloadLink } from '../../OrderUiParts';
import { useBuyAgain } from '../../useBuyAgain';
import { atelierTheme as t } from '../theme.config';

/** Theme 01's Order page (Shopify customer account "Order"): status badges,
 *  timeline, tracking, items, summary, shipping address, Buy again / Return. */
export function AtelierOrderDetailPage() {
  useRequireRealAccount();
  useStorefrontSeo({ title: 'Order', noindex: true });
  const { orderId = '' } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const buyAgain = useBuyAgain();

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    apiGetOrderById(orderId)
      .then(res => { if (!cancelled) { if (res.data) setOrder(res.data); else setNotFound(true); } })
      .catch(err => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) setNotFound(true);
        else setError(err instanceof Error ? err.message : 'Could not load this order.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, attempt]);

  const card = { border: `1px solid ${t.colors.border}`, padding: '20px', marginBottom: '20px' } as const;
  const h2 = { fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 600, color: t.colors.ink, marginBottom: '14px' } as const;
  const body = { fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink } as const;
  const muted = { fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted } as const;
  const btn = { fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.ink, border: `1px solid ${t.colors.border}`, padding: '9px 18px' } as const;

  const back = (
    <Link to="/orders" className="inline-flex items-center gap-1.5 no-underline" style={{ ...muted, marginBottom: '16px' }}>
      <ArrowLeft size={13} /> Orders
    </Link>
  );

  let content;
  if (loading && !order) {
    content = <div className="animate-pulse" aria-busy="true" style={{ height: '420px', background: t.colors.bgAlt }} />;
  } else if (notFound) {
    content = (
      <div className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1px solid ${t.colors.border}` }}>
        <Package size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
        <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 600, color: t.colors.ink }}>Order not found</p>
        <Link to="/orders" className="underline" style={{ ...body, marginTop: '8px' }}>Back to orders</Link>
      </div>
    );
  } else if (error || !order) {
    content = (
      <div role="alert" className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1px solid ${t.colors.border}` }}>
        <AlertCircle size={26} style={{ color: t.colors.danger, marginBottom: '12px' }} />
        <p style={body}>{error || 'Could not load this order.'}</p>
        <button type="button" onClick={retry} className="cursor-pointer bg-transparent" style={{ ...btn, marginTop: '14px' }}>Try again</button>
      </div>
    );
  } else {
    const sym = currencySymbol(order.currency);
    const money = (n: number) => `${sym}${fmt2(n)}`;
    const timeline = buildOrderTimeline(order);
    const subs = order.sellerOrders ?? [];
    const addr = formatShippingAddress(order.shippingAddress);
    const discounts = [
      { label: order.couponCode ? `Coupon (${order.couponCode})` : 'Coupon', amount: order.couponDiscountTotal ?? 0 },
      { label: 'Gift card', amount: order.giftCardDiscountTotal ?? 0 },
      { label: 'Store credit', amount: order.storeCreditDiscountTotal ?? 0 },
      { label: 'Promotion', amount: (order.campaignDiscountTotal ?? 0) + (order.autoDiscountTotal ?? 0) },
    ].filter(d => d.amount > 0);
    const method = paymentMethodLabel(order.paymentType);
    const row = (label: string, value: string, strong = false) => (
      <div key={label} className="flex items-center justify-between" style={{ padding: '5px 0', fontFamily: t.fonts.body, fontSize: strong ? '14px' : '13px', fontWeight: strong ? 600 : 400, color: t.colors.ink }}>
        <span style={strong ? undefined : { color: t.colors.inkMuted }}>{label}</span><span>{value}</span>
      </div>
    );

    content = (
      <>
        <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink }}>Order #{order.orderNumber}</h1>
            <p style={{ ...muted, marginTop: '4px' }}>Placed on {formatOrderDate(order.createdAt, true)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <OrderBadge badge={derivePaymentBadge(order)} fontFamily={t.fonts.body} />
            <OrderBadge badge={deriveFulfillmentBadge(order)} fontFamily={t.fonts.body} />
          </div>
        </div>

        <section style={card} aria-label="Order status">
          <ol className="flex items-start justify-between gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {timeline.map(step => {
              const cancelled = step.label === 'Cancelled';
              const color = cancelled ? BADGE_TONE_COLOR.danger : step.done ? t.colors.ink : t.colors.inkMuted;
              return (
                <li key={step.label} className="flex-1 min-w-0" style={{ opacity: step.done ? 1 : 0.55 }}>
                  <span aria-hidden style={{ display: 'block', height: '3px', background: cancelled ? BADGE_TONE_COLOR.danger : step.done ? t.colors.accent : t.colors.border, marginBottom: '8px' }} />
                  <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color }}>{step.label}</p>
                  {step.date && <p style={{ ...muted, fontSize: '11px', marginTop: '2px' }}>{step.date}</p>}
                </li>
              );
            })}
          </ol>
        </section>

        {subs.filter(s => s.tracking && (s.tracking.carrier || s.tracking.trackingNumber)).map((s, i) => {
          const url = safeTrackingUrl(s.tracking?.trackingUrl);
          return (
            <section key={s._id ?? `${s.storeId}-${i}`} style={card} aria-label="Tracking">
              <p style={{ ...h2, display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={15} style={{ color: t.colors.accent }} /> Tracking</p>
              {s.tracking?.carrier && <p style={body}>Carrier: {s.tracking.carrier}</p>}
              {s.tracking?.trackingNumber && <p style={{ ...body, marginTop: '4px' }}>Tracking number: <span style={{ fontFamily: 'monospace' }}>{s.tracking.trackingNumber}</span></p>}
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block underline" style={{ ...body, fontWeight: 600, marginTop: '10px' }}>
                  Track package
                </a>
              )}
            </section>
          );
        })}

        <section style={card}>
          <p style={h2}>Items</p>
          {subs.flatMap(s => s.items ?? []).map((item, i) => (
            <div key={item.itemId ?? item._id ?? i} className="flex items-start gap-3" style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.colors.border}` }}>
              <div className="shrink-0 flex items-center justify-center" style={{ width: '56px', height: '56px', background: t.colors.bgAlt }}>
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={18} style={{ color: t.colors.inkMuted }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ ...body, fontWeight: 600 }}>{item.name}</p>
                {item.options && item.options.length > 0 && (
                  <p style={{ ...muted, marginTop: '2px' }}>{item.options.map(o => `${o.name}: ${o.value}`).join(' / ')}</p>
                )}
                <p style={{ ...muted, marginTop: '2px' }}>{money(item.price)} x {item.quantity}</p>
                {(item.refundedAmount ?? 0) > 0 && (
                  <p style={{ ...muted, color: BADGE_TONE_COLOR.danger, marginTop: '2px' }}>Refunded {money(item.refundedAmount ?? 0)}</p>
                )}
                {item.status === 'cancelled' && <p style={{ ...muted, color: BADGE_TONE_COLOR.danger, marginTop: '2px' }}>Cancelled</p>}
                {isDigitalItem(item) && (
                  <div style={{ marginTop: '6px' }}>
                    <OrderDownloadLink orderId={order._id} productId={item.productId} color={t.colors.accent} fontFamily={t.fonts.body} />
                  </div>
                )}
              </div>
              <p className="shrink-0" style={{ ...body, fontWeight: 600 }}>{money(item.totalPrice)}</p>
            </div>
          ))}
        </section>

        <section style={card}>
          <p style={h2}>Order summary</p>
          {row('Subtotal', money(order.subtotal))}
          {discounts.map(d => row(d.label, `-${money(d.amount)}`))}
          {row('Shipping', money(order.shippingFee))}
          {row('Tax', money(order.taxAmount))}
          <div style={{ borderTop: `1px solid ${t.colors.border}`, marginTop: '8px', paddingTop: '8px' }}>
            {row('Total', money(order.totalAmount), true)}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <section style={{ ...card, marginBottom: 0 }}>
            <p style={h2}>Shipping address</p>
            {addr.name || addr.lines.length > 0 ? (
              <>
                {addr.name && <p style={{ ...body, fontWeight: 600 }}>{addr.name}</p>}
                {addr.lines.map(l => <p key={l} style={{ ...muted, marginTop: '2px' }}>{l}</p>)}
              </>
            ) : <p style={muted}>No shipping address.</p>}
          </section>
          <section style={{ ...card, marginBottom: 0 }}>
            <p style={h2}>Payment</p>
            <p style={body}>{method || '-'}</p>
            <div style={{ marginTop: '8px' }}><OrderBadge badge={derivePaymentBadge(order)} fontFamily={t.fonts.body} /></div>
          </section>
        </div>

        <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: '24px' }}>
          <button type="button" onClick={() => buyAgain.run(order)} disabled={buyAgain.busy} className="inline-flex items-center gap-2 cursor-pointer disabled:opacity-60" style={{ ...btn, background: t.colors.ink, color: t.colors.bg, border: `1px solid ${t.colors.ink}` }}>
            {buyAgain.busy && <Loader2 size={13} className="animate-spin" />} Buy again
          </button>
          {canRequestReturn(order) && (
            <Link to="/returns" className="no-underline" style={btn}>Request a return</Link>
          )}
        </div>
        {buyAgain.result && (
          <div role="status" style={{ marginTop: '14px' }}>
            {buyAgain.result.added > 0 && (
              <p style={{ ...body, fontWeight: 600 }}>
                {buyAgain.result.added} {buyAgain.result.added === 1 ? 'item' : 'items'} added to your cart.{' '}
                <Link to="/cart" className="underline">Go to cart</Link>
              </p>
            )}
            {buyAgain.result.added === 0 && buyAgain.result.errors.length === 0 && (
              <p style={muted}>Nothing in this order can be added to your cart again.</p>
            )}
            {buyAgain.result.errors.map(e => (
              <p key={e} className="flex items-center gap-1.5" style={{ ...muted, color: t.colors.danger, marginTop: '4px' }}><AlertCircle size={12} /> {e}</p>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      {back}
      {content}
    </main>
  );
}
