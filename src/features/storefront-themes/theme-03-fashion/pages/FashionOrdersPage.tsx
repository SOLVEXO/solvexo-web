import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Package } from 'lucide-react';
import { apiGetMyOrders, type OrderSummary } from '@/api/services/orders';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { Card, EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { deriveFulfillmentBadge, derivePaymentBadge, formatOrderDate } from '../../orderUi';
import { useLoad } from '../../core/pageHooks';
import { OrderPill, Pager, RequireAccount } from './orders/OrderParts';
import { nativeMoney } from '../../core/money/nativeMoney';

const LIMIT = 10;

function OrderRow({ o }: { o: OrderSummary }) {
  const items = o.stores.flatMap(s => s.items ?? []);
  const shownCount = items.length > 3 ? 2 : items.length;
  const shown = items.slice(0, shownCount);
  const pickup = o.fulfillmentMethod === 'pickup' ? [o.pickupLocation?.name, o.pickupLocation?.address].filter(Boolean).join(' - ') : '';
  return (
    <li>
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 md:p-5">
          <div className="flex shrink-0 -space-x-3 w-[120px]" aria-hidden>
            {shown.map((i, k) => (
              <span key={`${i.itemId}-${k}`} className="grid size-12 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt, borderRadius: 12, border: `2px solid ${t.colors.bg}` }}>
                {i.image ? <img src={i.image} alt="" className="size-full object-cover" /> : <Package size={16} style={{ color: t.colors.inkMuted }} />}
              </span>
            ))}
            {items.length > shown.length && <span className="grid size-12 place-items-center text-xs font-medium" style={{ background: t.colors.bgAlt, borderRadius: 12, border: `2px solid ${t.colors.bg}` }}>+{items.length - shown.length}</span>}
          </div>
          <div className="min-w-[160px] flex-1">
            <Link to={`/orders/${o.orderId}`} className="text-base font-semibold no-underline" style={{ color: t.colors.ink }}>Order #{o.orderNumber}</Link>
            <p className="m-0 mt-0.5 text-[13px]" style={{ color: t.colors.inkMuted }}>{formatOrderDate(o.createdAt)} · {items.length} {items.length === 1 ? 'item' : 'items'}</p>
            {pickup && <p className="m-0 mt-0.5 text-[13px]" style={{ color: t.colors.inkMuted }}>Pickup: {pickup}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderPill badge={derivePaymentBadge(o)} />
            <OrderPill badge={deriveFulfillmentBadge(o)} />
          </div>
          <div className="flex items-center gap-4 sm:ml-auto">
            <p className="m-0 text-base font-semibold">{nativeMoney(o.totalAmount, o.currency)}</p>
            <Link to={`/orders/${o.orderId}`} aria-label={`View order ${o.orderNumber}`} className="grid size-10 place-items-center rounded-full no-underline" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink }}><ArrowUpRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </Card>
    </li>
  );
}

function OrdersList() {
  useStorefrontSeo({ title: 'Orders', noindex: true });
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useLoad(() => apiGetMyOrders({ page, limit: LIMIT }), [page]);
  const orders = data?.data.orders ?? [];
  const totalPages = Math.max(1, data?.data.pagination?.totalPages ?? 1);

  return (
    <AccountLayout title={ts('cart.yourLead', 'Your')} accent={ts('pg.word_orders', 'orders')} subtitle="Track deliveries, download receipts and buy your favourites again.">
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_orders', 'Loading orders')}><SkeletonBlock h={92} rows={3} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_orders', 'We could not load your orders.')} onRetry={retry} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title={ts('orders.none', 'No orders yet')} text={ts('pg.when_you_place_an_order_it_will_show_up_', 'When you place an order it will show up here.')} action={<Link to="/search" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('cart.startShopping', 'Start shopping')}</Link>} />
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">{orders.map(o => <OrderRow key={o.orderId} o={o} />)}</ul>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </AccountLayout>
  );
}

/** `/orders` - paginated order history with payment + fulfilment pills. */
export function FashionOrdersPage() {
  return <RequireAccount><OrdersList /></RequireAccount>;
}
