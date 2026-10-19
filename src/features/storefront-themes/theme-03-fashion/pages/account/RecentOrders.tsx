import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, Loader2, Package } from 'lucide-react';
import { apiGetDownloadLink, apiGetMyOrders, type OrderStatus, type OrderSummary } from '@/api/services/orders';
import { formatOrderDate } from '../../../orderUi';
import { nativeMoney } from '../../../core/money/nativeMoney';
import { fashionTheme as t } from '../../theme.config';
import { Card, EmptyState, ErrorState, SectionHeading, SkeletonBlock, StatusPill } from '../../ui/primitives';
import { useLoad } from '../../../core/pageHooks';

const LABEL: Record<OrderStatus, string> = { pending: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled' };
const TONE: Record<OrderStatus, 'neutral' | 'good' | 'warn' | 'bad'> = { pending: 'warn', processing: 'neutral', shipped: 'neutral', delivered: 'good', completed: 'good', cancelled: 'bad' };

function DownloadLink({ orderId, productId }: { orderId: string; productId: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => {
    setBusy(true); setFailed(false);
    try {
      const res = await apiGetDownloadLink(orderId, productId, 0);
      window.open(`${import.meta.env.VITE_API_URL as string}${res.data.endpoint}?token=${res.data.token}`, '_blank');
    } catch { setFailed(true); } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={go} disabled={busy} className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[13px] font-semibold underline" style={{ color: failed ? t.colors.danger : t.colors.ink }}>
      {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Download size={13} aria-hidden />}{failed ? 'Failed, retry' : 'Download'}
    </button>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const [open, setOpen] = useState(false);
  const money = nativeMoney;
  const items = (order.stores ?? []).flatMap(s => s.items ?? []);
  return (
    <div style={{ border: `1px solid ${t.colors.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-4 text-left" style={{ color: t.colors.ink }}>
        <span className="min-w-0"><span className="block text-sm font-semibold">Order #{order.orderNumber}</span><span className="block text-[13px]" style={{ color: t.colors.inkMuted }}>{formatOrderDate(order.createdAt)}</span></span>
        <span className="flex shrink-0 items-center gap-3">
          <StatusPill tone={TONE[order.orderStatus] ?? 'neutral'}>{LABEL[order.orderStatus] ?? order.orderStatus}</StatusPill>
          <span className="text-sm font-semibold">{money(order.totalAmount, order.currency)}</span>
          <ChevronDown size={16} aria-hidden style={{ color: t.colors.inkMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </span>
      </button>
      {open && (
        <ul className="m-0 list-none px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${t.colors.border}` }}>
          {items.map(item => (
            <li key={item.itemId} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span className="flex min-w-0 items-center gap-2"><Package size={14} aria-hidden style={{ color: t.colors.inkMuted, flexShrink: 0 }} /><span className="truncate">{item.name} x{item.quantity}</span></span>
              <span className="flex shrink-0 items-center gap-3">
                {item.type === 'digital' && <DownloadLink orderId={order.orderId} productId={item.productId} />}
                <span style={{ color: t.colors.inkMuted }}>{money(item.totalPrice, order.currency)}</span>
              </span>
            </li>
          ))}
          <li className="pt-2"><Link to={`/orders/${order.orderId}`} className="text-sm font-semibold underline" style={{ color: t.colors.ink }}>{ts('pg.view_order', 'View order')}</Link></li>
        </ul>
      )}
    </div>
  );
}

/** The 20 most recent orders (expandable) with a link to the full list. */
export function RecentOrders() {
  const { data, loading, error, retry } = useLoad(() => apiGetMyOrders({ page: 1, limit: 20 }).then(r => r.data.orders), []);
  return (
    <Card>
      <SectionHeading action={data && data.length > 0 ? <Link to="/orders" className="text-sm font-semibold underline" style={{ color: t.colors.ink }}>{ts('account.viewAllOrders', 'View all orders')}</Link> : undefined}>{ts('pg.order_history', 'Order history')}</SectionHeading>
      {loading ? <SkeletonBlock h={64} rows={2} />
        : error ? <ErrorState message={ts('pg.could_not_load_your_orders_right_now', 'Could not load your orders right now.')} onRetry={retry} />
        : !data || data.length === 0 ? <EmptyState icon={<Package size={22} aria-hidden />} title={ts('orders.none', 'No orders yet')} text={ts('pg.when_you_place_an_order_it_will_show_up_', 'When you place an order it will show up here.')} />
        : <div className="flex flex-col gap-3">{data.map(o => <OrderRow key={o.orderId} order={o} />)}</div>}
    </Card>
  );
}
