import { Link, useParams } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { Package } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { deriveFulfillmentBadge, derivePaymentBadge, formatOrderDate } from '../../orderUi';
import { useLoad } from '../../core/pageHooks';
import { loadOrder } from '../../core/orders/orderLoaders';
import { BackLink, OrderPill, RequireAccount } from './orders/OrderParts';
import { OrderView } from './orders/OrderView';
import { BuyAgainBar } from './orders/BuyAgainBar';
import { WithPageSections } from '../ui/WithPageSections';

function OrderDetail() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const { data, loading, error, retry } = useLoad(() => loadOrder(orderId), [orderId]);
  const order = data?.order ?? null;
  useStorefrontSeo({ title: order ? ts('orders.orderNumber', 'Order #{{number}}', { number: order.orderNumber }) : ts('checkout.orderLabel', 'Order'), noindex: true });

  return (
    <AccountLayout
      title={ts('checkout.orderLabel', 'Order')}
      accent={order ? `#${order.orderNumber}` : undefined}
      subtitle={order ? ts('pg.placed_on_date', 'Placed on {{date}}', { date: formatOrderDate(order.createdAt, true) }) : undefined}
      actions={order && <div className="flex flex-wrap gap-2"><OrderPill badge={derivePaymentBadge(order)} /><OrderPill badge={deriveFulfillmentBadge(order)} /></div>}
    >
      <BackLink to="/orders">{ts('pg.all_orders', 'All orders')}</BackLink>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_order', 'Loading order')}><SkeletonBlock h={160} rows={3} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_this_order', 'We could not load this order.')} onRetry={retry} />
      ) : !order ? (
        <EmptyState icon={<Package size={24} />} title={ts('orders.notFound', 'Order not found')} text={ts('pg.it_may_belong_to_another_account_or_no_l', 'It may belong to another account, or no longer exist.')} action={<Link to="/orders" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('orders.backToOrders', 'Back to orders')}</Link>} />
      ) : (
        <OrderView order={order} mode="account" actions={<BuyAgainBar order={order} />} />
      )}
    </AccountLayout>
  );
}

/** `/orders/:orderId` - status, timeline, tracking, items, totals, address, buy again / return. */
export function FashionOrderDetailPage() {
  return <WithPageSections pageKey="order-detail"><FashionOrderDetailPageContent /></WithPageSections>;
}

function FashionOrderDetailPageContent() {
  return <RequireAccount><OrderDetail /></RequireAccount>;
}
