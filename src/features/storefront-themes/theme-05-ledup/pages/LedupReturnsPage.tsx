import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { apiGetMyOrders } from '@/api/services/orders';
import { ledupTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/ledupAccount';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/ledupForm';
import { LedupPanel } from '../ui/ledupPanels';
import { formatOrderDate } from '../../orderUi';
import { useLoad } from '../../core/pageHooks';
import { Pager, RequireAccount } from './orders/OrderParts';
import { ReturnItemRow } from './orders/ReturnItemRow';

const LIMIT = 20;
const ELIGIBLE = new Set(['delivered', 'completed']);

function Returns() {
  useStorefrontSeo({ title: ts('account.returns', 'Returns'), noindex: true });
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useLoad(() => apiGetMyOrders({ page, limit: LIMIT }), [page]);
  const eligible = (data?.data.orders ?? []).filter(o => ELIGIBLE.has(o.orderStatus));
  const totalPages = Math.max(1, data?.data.pagination?.totalPages ?? 1);

  return (
    <AccountLayout title={ts('h.returns_refunds', 'Returns & *refunds*')} subtitle={ts('pg.request_a_return_on_any_delivered_item', 'Request a return on any delivered item and follow it until your refund or exchange.')}>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_returns', 'Loading returns')}><SkeletonBlock h={120} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_orders', 'We could not load your orders.')} onRetry={retry} />
      ) : eligible.length === 0 ? (
        <>
          <EmptyState icon={<RotateCcw size={24} />} title={ts('returns.noneReturnable', 'No returnable orders')} text={totalPages > 1 ? ts('pg.nothing_on_this_page_has_been_delivered', 'Nothing on this page has been delivered yet. Try another page.') : ts('pg.delivered_orders_will_show_up_here', 'Delivered orders will show up here, ready to return.')} action={totalPages <= 1 ? <Link to="/orders" className="tx-btn" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.view_orders', 'View orders')}</Link> : undefined} />
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            {eligible.map(order => {
              const items = order.stores.flatMap(s => s.items ?? []).filter(i => i.status !== 'cancelled');
              if (items.length === 0) return null;
              return (
                <LedupPanel key={order.orderId} flush
                  title={<Link to={`/orders/${order.orderId}`} className="no-underline" style={{ color: t.colors.ink }}>{ts('orders.orderNumber', 'Order #{{number}}', { number: order.orderNumber })}</Link>}
                  action={<span className="text-[13px]" style={{ color: t.colors.inkMuted }}>{formatOrderDate(order.createdAt)}</span>}>
                  <ul className="m-0 list-none px-5 pb-1">
                    {items.map(item => <ReturnItemRow key={item.itemId} orderId={order.orderId} item={item} />)}
                  </ul>
                </LedupPanel>
              );
            })}
          </div>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </AccountLayout>
  );
}

/** `/returns` - delivered orders, per-line return request form, progress and return label. */
export function LedupReturnsPage() {
  return <RequireAccount><Returns /></RequireAccount>;
}
