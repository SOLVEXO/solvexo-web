import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { apiGetMyOrders } from '@/api/services/orders';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { Card, EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { formatOrderDate } from '../../orderUi';
import { useLoad } from '../../core/pageHooks';
import { Pager, RequireAccount } from './orders/OrderParts';
import { ReturnItemRow } from './orders/ReturnItemRow';

const LIMIT = 20;
const ELIGIBLE = new Set(['delivered', 'completed']);

function Returns() {
  useStorefrontSeo({ title: 'Returns', noindex: true });
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useLoad(() => apiGetMyOrders({ page, limit: LIMIT }), [page]);
  const eligible = (data?.data.orders ?? []).filter(o => ELIGIBLE.has(o.orderStatus));
  const totalPages = Math.max(1, data?.data.pagination?.totalPages ?? 1);

  return (
    <AccountLayout title={ts('pg.returns', 'Returns &')} accent={ts('pg.word_refunds', 'refunds')} subtitle="Request a return on any delivered item and follow it until your refund or exchange.">
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_returns', 'Loading returns')}><SkeletonBlock h={120} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_your_orders', 'We could not load your orders.')} onRetry={retry} />
      ) : eligible.length === 0 ? (
        <>
          <EmptyState icon={<RotateCcw size={24} />} title={ts('returns.noneReturnable', 'No returnable orders')} text={totalPages > 1 ? 'Nothing on this page has been delivered yet. Try another page.' : 'Delivered orders will show up here, ready to return.'} action={totalPages <= 1 ? <Link to="/orders" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.view_orders', 'View orders')}</Link> : undefined} />
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            {eligible.map(order => {
              const items = order.stores.flatMap(s => s.items ?? []).filter(i => i.status !== 'cancelled');
              if (items.length === 0) return null;
              return (
                <Card key={order.orderId} pad={false}>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 md:px-7" style={{ background: t.colors.bgAlt, borderRadius: '20px 20px 0 0' }}>
                    <Link to={`/orders/${order.orderId}`} className="text-[15px] font-semibold no-underline" style={{ color: t.colors.ink }}>Order #{order.orderNumber}</Link>
                    <span className="text-[13px]" style={{ color: t.colors.inkMuted }}>{formatOrderDate(order.createdAt)}</span>
                  </div>
                  <ul className="m-0 list-none px-5 pb-1 md:px-7">
                    {items.map(item => <ReturnItemRow key={item.itemId} orderId={order.orderId} item={item} />)}
                  </ul>
                </Card>
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
export function FashionReturnsPage() {
  return <RequireAccount><Returns /></RequireAccount>;
}
