import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiGetMyOrders, type OrderSummary } from '@/api/services/orders';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { derivePaymentBadge, deriveFulfillmentBadge, formatOrderDate } from '../../orderUi';
import { OrderBadge } from '../../OrderUiParts';
import { novaTheme as t } from '../theme.config';

const LIMIT = 10;

/** Theme 02's Orders page (Shopify customer account "Orders"): paginated list
 *  with order number, date, payment + fulfillment badges and total. */
export function NovaOrdersPage() {
  useRequireRealAccount();
  useStorefrontSeo({ title: 'Orders', noindex: true });
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetMyOrders({ page, limit: LIMIT })
      .then(res => {
        if (cancelled) return;
        setOrders(res.data.orders);
        setTotalPages(Math.max(1, res.data.pagination?.totalPages ?? 1));
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your orders.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, attempt]);

  const pageBtn = { color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '7px 16px' } as const;

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '26px', fontWeight: 700, color: t.colors.ink, marginBottom: '28px' }}>
        Orders
      </h1>

      {loading && !orders ? (
        <div className="flex flex-col gap-2.5" aria-busy="true">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse" style={{ height: '76px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />)}
        </div>
      ) : error && !orders ? (
        <div role="alert" className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <AlertCircle size={26} style={{ color: t.colors.danger, marginBottom: '12px' }} />
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.ink }}>{error}</p>
          <button type="button" onClick={retry} className="cursor-pointer bg-transparent" style={{ ...pageBtn, marginTop: '14px', fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700 }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div role="alert" className="flex items-center gap-2" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '12px' }}>
              <AlertCircle size={13} /> {error}
              <button type="button" onClick={retry} className="cursor-pointer bg-transparent underline" style={{ color: t.colors.ink, border: 'none' }}>Retry</button>
            </div>
          )}
          {!orders || orders.length === 0 ? (
            <div className="flex flex-col items-center text-center" style={{ padding: '56px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
              <Package size={26} style={{ color: t.colors.inkMuted, marginBottom: '12px' }} />
              <p style={{ fontFamily: t.fonts.display, fontSize: '15px', fontWeight: 700, color: t.colors.ink }}>No orders yet</p>
              <Link to="/" className="underline" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, marginTop: '8px' }}>
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden', opacity: loading ? 0.6 : 1 }}>
              {orders.map((o, i) => (
                <div key={o.orderId} className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: '16px 18px', borderTop: i === 0 ? 'none' : `1.5px solid ${t.colors.border}` }}>
                  <div className="min-w-0">
                    <Link to={`/orders/${o.orderId}`} className="underline" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 700, color: t.colors.ink }}>
                      Order #{o.orderNumber}
                    </Link>
                    <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted, marginTop: '2px' }}>{formatOrderDate(o.createdAt)}</p>
                    {o.fulfillmentMethod === 'pickup' && (o.pickupLocation?.name || o.pickupLocation?.address) && (
                      <p style={{ fontFamily: t.fonts.body, fontSize: '11.5px', color: t.colors.inkMuted, marginTop: '2px' }}>
                        Pickup: {[o.pickupLocation?.name, o.pickupLocation?.address].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <OrderBadge badge={derivePaymentBadge(o)} fontFamily={t.fonts.body} radius="9999px" />
                    <OrderBadge badge={deriveFulfillmentBadge(o)} fontFamily={t.fonts.body} radius="9999px" />
                  </div>
                  <p className="shrink-0" style={{ fontFamily: t.fonts.body, fontSize: '13.5px', fontWeight: 700, color: t.colors.ink }}>
                    {currencySymbol(o.currency)}{fmt2(o.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {orders && totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ marginTop: '16px', fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={pageBtn}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed" style={pageBtn}>Next</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
