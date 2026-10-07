import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Package } from 'lucide-react';
import { apiGetOrderByStatusToken, type OrderDetail } from '@/api/services/orders';
import { currencySymbol, fmt2 } from '@/utils/currency';
import {
  derivePaymentBadge, deriveFulfillmentBadge, formatOrderDate, buildOrderTimeline, paymentMethodLabel,
  isPickupOrder, formatShippingAddress, BADGE_TONE_COLOR,
} from './orderUi';
import { OrderBadge } from './OrderUiParts';
import { OrderShipments, OrderPickupLocation, type FulfilmentLook } from './OrderFulfilmentParts';

/** Minimal look-and-feel a theme passes in so one component serves both themes. */
export interface OrderStatusLook {
  colors: { ink: string; inkMuted: string; border: string; bg: string; bgAlt: string; accent: string; danger: string };
  fonts: { display: string; body: string };
  /** Border width incl. unit, e.g. '1px' / '1.5px'. */
  borderWidth: string;
  /** Card / item thumbnail radius ('0' for square themes). */
  radius: string;
  /** Badge + button radius. */
  pillRadius?: string;
  headingWeight: number;
  h1Size: string;
  containerPadX: string;
}

/** Public, read-only "Order status page" (Shopify): reached from the order
 *  confirmation email via `/order-status/:token`, no login required. Same
 *  content as the account Order page minus Buy again / returns / downloads. */
export function OrderStatusView({ look: t }: { look: OrderStatusLook }) {
  const { token = '' } = useParams<{ token: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    apiGetOrderByStatusToken(token)
      .then(res => { if (!cancelled) { if (res.data) setOrder(res.data); else setNotFound(true); } })
      .catch(err => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403 || status === 400 || status === 410) setNotFound(true);
        else setError(err instanceof Error ? err.message : 'Could not load this order.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, attempt]);

  const bw = t.borderWidth;
  const card = { border: `${bw} solid ${t.colors.border}`, borderRadius: t.radius, padding: '20px', marginBottom: '20px' } as const;
  const h2 = { fontFamily: t.fonts.display, fontSize: '16px', fontWeight: t.headingWeight, color: t.colors.ink, marginBottom: '14px' } as const;
  const body = { fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink } as const;
  const muted = { fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted } as const;
  const btn = { fontFamily: t.fonts.body, fontSize: '12px', fontWeight: t.headingWeight, color: t.colors.ink, border: `${bw} solid ${t.colors.border}`, borderRadius: t.pillRadius ?? t.radius, padding: '9px 20px' } as const;
  const emptyBox = { padding: '56px 16px', border: `${bw} solid ${t.colors.border}`, borderRadius: t.radius } as const;

  let content;
  if (loading && !order) {
    content = <div className="animate-pulse" aria-busy="true" style={{ height: '420px', background: t.colors.bgAlt, borderRadius: t.radius }} />;
  } else if (notFound) {
    content = (
      <div className="flex flex-col items-center text-center" style={emptyBox}>
        <Package size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
        <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: t.headingWeight, color: t.colors.ink }}>We couldn't find this order</p>
        <p style={{ ...muted, marginTop: '6px' }}>This link may be invalid or expired. Check the link in your order confirmation email.</p>
        <Link to="/" className="underline" style={{ ...body, marginTop: '10px' }}>Continue shopping</Link>
      </div>
    );
  } else if (error || !order) {
    content = (
      <div role="alert" className="flex flex-col items-center text-center" style={emptyBox}>
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
    const look: FulfilmentLook = { card, h2, body, muted, accent: t.colors.accent, strong: t.headingWeight };
    const row = (label: string, value: string, strong = false) => (
      <div key={label} className="flex items-center justify-between" style={{ padding: '5px 0', fontFamily: t.fonts.body, fontSize: strong ? '14px' : '13px', fontWeight: strong ? t.headingWeight : 400, color: t.colors.ink }}>
        <span style={strong ? undefined : { color: t.colors.inkMuted }}>{label}</span><span>{value}</span>
      </div>
    );

    content = (
      <>
        <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: t.fonts.display, fontSize: t.h1Size, fontWeight: t.headingWeight, color: t.colors.ink }}>Order #{order.orderNumber}</h1>
            <p style={{ ...muted, marginTop: '4px' }}>Placed on {formatOrderDate(order.createdAt, true)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <OrderBadge badge={derivePaymentBadge(order)} fontFamily={t.fonts.body} radius={t.pillRadius} />
            <OrderBadge badge={deriveFulfillmentBadge(order)} fontFamily={t.fonts.body} radius={t.pillRadius} />
          </div>
        </div>

        <section style={card} aria-label="Order status">
          <ol className="flex items-start justify-between gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {timeline.map(step => {
              const cancelled = step.label === 'Cancelled';
              const color = cancelled ? BADGE_TONE_COLOR.danger : step.done ? t.colors.ink : t.colors.inkMuted;
              return (
                <li key={step.label} className="flex-1 min-w-0" style={{ opacity: step.done ? 1 : 0.55 }}>
                  <span aria-hidden style={{ display: 'block', height: '3px', borderRadius: t.pillRadius, background: cancelled ? BADGE_TONE_COLOR.danger : step.done ? t.colors.accent : t.colors.border, marginBottom: '8px' }} />
                  <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: t.headingWeight, color }}>{step.label}</p>
                  {step.date && <p style={{ ...muted, fontSize: '11px', marginTop: '2px' }}>{step.date}</p>}
                </li>
              );
            })}
          </ol>
        </section>

        <OrderShipments order={order} look={look} />

        <section style={card}>
          <p style={h2}>Items</p>
          {subs.flatMap(s => s.items ?? []).map((item, i) => (
            <div key={item.itemId ?? item._id ?? i} className="flex items-start gap-3" style={{ padding: '12px 0', borderTop: i === 0 ? 'none' : `${bw} solid ${t.colors.border}` }}>
              <div className="shrink-0 flex items-center justify-center" style={{ width: '56px', height: '56px', background: t.colors.bgAlt, borderRadius: t.radius, overflow: 'hidden' }}>
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={18} style={{ color: t.colors.inkMuted }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ ...body, fontWeight: t.headingWeight }}>{item.name}</p>
                {item.options && item.options.length > 0 && (
                  <p style={{ ...muted, marginTop: '2px' }}>{item.options.map(o => `${o.name}: ${o.value}`).join(' / ')}</p>
                )}
                <p style={{ ...muted, marginTop: '2px' }}>{money(item.price)} x {item.quantity}</p>
                {(item.refundedAmount ?? 0) > 0 && (
                  <p style={{ ...muted, color: BADGE_TONE_COLOR.danger, marginTop: '2px' }}>Refunded {money(item.refundedAmount ?? 0)}</p>
                )}
                {item.status === 'cancelled' && <p style={{ ...muted, color: BADGE_TONE_COLOR.danger, marginTop: '2px' }}>Cancelled</p>}
              </div>
              <p className="shrink-0" style={{ ...body, fontWeight: t.headingWeight }}>{money(item.totalPrice)}</p>
            </div>
          ))}
        </section>

        <section style={card}>
          <p style={h2}>Order summary</p>
          {row('Subtotal', money(order.subtotal))}
          {discounts.map(d => row(d.label, `-${money(d.amount)}`))}
          {row('Shipping', money(order.shippingFee))}
          {row('Tax', money(order.taxAmount))}
          {(order.includedTaxAmount ?? 0) > 0 && row('Including taxes', money(order.includedTaxAmount ?? 0))}
          <div style={{ borderTop: `${bw} solid ${t.colors.border}`, marginTop: '8px', paddingTop: '8px' }}>
            {row('Total', money(order.totalAmount), true)}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {isPickupOrder(order) ? (
            <OrderPickupLocation order={order} look={look} />
          ) : (
            <section style={{ ...card, marginBottom: 0 }}>
              <p style={h2}>Shipping address</p>
              {addr.name || addr.lines.length > 0 ? (
                <>
                  {addr.name && <p style={{ ...body, fontWeight: t.headingWeight }}>{addr.name}</p>}
                  {addr.lines.map(l => <p key={l} style={{ ...muted, marginTop: '2px' }}>{l}</p>)}
                </>
              ) : <p style={muted}>No shipping address.</p>}
            </section>
          )}
          <section style={{ ...card, marginBottom: 0 }}>
            <p style={h2}>Payment</p>
            <p style={body}>{method || '-'}</p>
            <div style={{ marginTop: '8px' }}><OrderBadge badge={derivePaymentBadge(order)} fontFamily={t.fonts.body} radius={t.pillRadius} /></div>
          </section>
        </div>

        <section style={{ ...card, marginTop: '24px', marginBottom: 0 }} aria-label="Create an account">
          <p style={body}>Want to track all your orders in one place? Create an account with the same email.</p>
          <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: '12px' }}>
            <Link to="/register" className="no-underline" style={{ ...btn, background: t.colors.ink, color: t.colors.bg, border: `${bw} solid ${t.colors.ink}` }}>Create account</Link>
            <Link to="/login" className="no-underline" style={btn}>Sign in</Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.containerPadX}` }}>
      {content}
    </main>
  );
}
