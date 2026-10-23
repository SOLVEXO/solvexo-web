import { Link, useParams } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { Package } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { Card, EmptyState, ErrorState, Page, PageTitle, SkeletonBlock } from '../ui/primitives';
import { deriveFulfillmentBadge, derivePaymentBadge, formatOrderDate } from '../../orderUi';
import { useLoad } from '../../core/pageHooks';
import { loadOrderByToken } from '../../core/orders/orderLoaders';
import { OrderPill } from './orders/OrderParts';
import { OrderView } from './orders/OrderView';

/** `/order-status/:token` - public, read-only tracking reached from the confirmation email (no login). */
export function FashionOrderStatusPage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, loading, error, retry } = useLoad(() => loadOrderByToken(token), [token]);
  const order = data?.order ?? null;
  const outlineLink = { border: `1px solid ${t.colors.border}`, color: t.colors.ink, borderRadius: t.buttonRadiusPx };
  useStorefrontSeo({ title: order ? ts('orders.orderNumber', 'Order #{{number}}', { number: order.orderNumber }) : ts('orders.statusAria', 'Order status'), noindex: true });

  return (
    <Page>
      <PageTitle
        subtitle={order ? ts('pg.placed_on_date', 'Placed on {{date}}', { date: formatOrderDate(order.createdAt, true) }) : undefined}
        actions={order && <div className="flex flex-wrap gap-2"><OrderPill badge={derivePaymentBadge(order)} /><OrderPill badge={deriveFulfillmentBadge(order)} /></div>}
      >{order ? ts('h.order_number', 'Order *#{{number}}*', { number: String(order.orderNumber).replace(/\*/g, '') }) : ts('orders.statusAria', 'Order status')}</PageTitle>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_order', 'Loading order')}><SkeletonBlock h={160} rows={3} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_this_order', 'We could not load this order.')} onRetry={retry} />
      ) : !order ? (
        <EmptyState icon={<Package size={24} />} title={ts('pg.we_could_not_find_this_order', 'We could not find this order')} text={ts('orders.statusInvalidLink', 'This link may be invalid or expired. Check the link in your order confirmation email.')} action={<Link to="/" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('cart.continueShoppingLower', 'Continue shopping')}</Link>} />
      ) : (
        <div className="flex flex-col gap-6">
          <OrderView order={order} mode="public" />
          <Card tone="soft">
            <p className="m-0 text-base font-medium">{ts('pg.want_to_track_all_your_orders_in_one_pla', 'Want to track all your orders in one place?')}</p>
            <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.create_an_account_with_the_same_email', 'Create an account with the same email address and this order will appear in your history.')}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/register" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('orders.createAccountBtn', 'Create account')}</Link>
              <Link to="/login" className="fx-pill" style={outlineLink}>{ts('auth.signInLink', 'Sign in')}</Link>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
