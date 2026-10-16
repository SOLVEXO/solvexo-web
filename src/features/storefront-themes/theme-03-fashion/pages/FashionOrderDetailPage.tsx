import { Link, useParams } from 'react-router-dom';
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

function OrderDetail() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const { data, loading, error, retry } = useLoad(() => loadOrder(orderId), [orderId]);
  const order = data?.order ?? null;
  useStorefrontSeo({ title: order ? `Order #${order.orderNumber}` : 'Order', noindex: true });

  return (
    <AccountLayout
      title="Order"
      accent={order ? `#${order.orderNumber}` : undefined}
      subtitle={order ? `Placed on ${formatOrderDate(order.createdAt, true)}` : undefined}
      actions={order && <div className="flex flex-wrap gap-2"><OrderPill badge={derivePaymentBadge(order)} /><OrderPill badge={deriveFulfillmentBadge(order)} /></div>}
    >
      <BackLink to="/orders">All orders</BackLink>
      {loading ? (
        <div role="status" aria-label="Loading order"><SkeletonBlock h={160} rows={3} /></div>
      ) : error ? (
        <ErrorState message="We could not load this order." onRetry={retry} />
      ) : !order ? (
        <EmptyState icon={<Package size={24} />} title="Order not found" text="It may belong to another account, or no longer exist." action={<Link to="/orders" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>Back to orders</Link>} />
      ) : (
        <OrderView order={order} mode="account" actions={<BuyAgainBar order={order} />} />
      )}
    </AccountLayout>
  );
}

/** `/orders/:orderId` - status, timeline, tracking, items, totals, address, buy again / return. */
export function FashionOrderDetailPage() {
  return <RequireAccount><OrderDetail /></RequireAccount>;
}
