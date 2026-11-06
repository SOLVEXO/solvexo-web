import { useState, type ReactNode } from 'react';
import { ts } from '@/utils/tStatic';
import { Package } from 'lucide-react';
import type { OrderDetail } from '@/api/services/orders';
import { techTheme as t } from '../../theme.config';
import type { MyReviewEntry } from '@/api/services/rating';
import { PillButton } from '../../ui/techForm';
import { TechPanel } from '../../ui/techPanels';
import { techTd, techTh } from '../../ui/techPanelStyles';
import { useReviewedProducts } from '../../../useReviewedProducts';
import { ReviewEditDialog, type ReviewTarget } from '../account/ReviewEditDialog';
import {
  derivePaymentBadge, formatShippingAddress, isDigitalItem, isPickupOrder, orderDisplaySubtotal, orderSummaryDiscountRows, paymentMethodLabel,
} from '../../../orderUi';
import { returnNextStepHint } from '../../../returnText';
import { nativeMoney } from '../../../core/money/nativeMoney';
import { OrderTimeline } from './OrderTimeline';
import { OrderPill } from './OrderParts';
import { ExchangeItemLink, ExchangeOrderBanner, OrderDownloadLink, OrderPickupLocation, OrderShipments, ReturnProgress } from './OrderExtras';

/** The body of a single order, shared by the signed-in order page and the public guest status page.
 *  `mode="public"` hides return progress, exchange links and downloads (read-only tracking).
 *  Tech layout: progress panel, an items TABLE (Product / Price / Qty / Total), and a side column of panels. */
export function OrderView({ order, mode, actions }: { order: OrderDetail; mode: 'account' | 'public'; actions?: ReactNode }) {
  const account = mode === 'account';
  const { byProduct, reload: reloadReviews } = useReviewedProducts();
  const [reviewing, setReviewing] = useState<{ review?: MyReviewEntry; target?: ReviewTarget } | null>(null);
  const money = (n: number) => nativeMoney(n, order.currency);
  const lines = (order.sellerOrders ?? []).flatMap(s => s.items ?? []);
  const addr = formatShippingAddress(order.shippingAddress);
  const discounts = orderSummaryDiscountRows(order);
  const promoSavings = (order.campaignDiscountTotal ?? 0) + (order.autoDiscountTotal ?? 0);
  const method = paymentMethodLabel(order.paymentType);
  const muted = { color: t.colors.inkMuted } as const;

  const row = (label: string, value: string) => (
    <div key={label} className="flex items-baseline justify-between gap-4 py-2 text-sm" style={{ borderBottom: `1px dashed ${t.colors.border}` }}>
      <dt style={muted}>{label}</dt><dd className="m-0 font-medium">{value}</dd>
    </div>
  );

  const reviewButton = (item: (typeof lines)[number]) => {
    if (!account || !['delivered', 'completed'].includes(String(item.status)) || !item.productId) return null;
    const mine = byProduct.get(item.productId);
    return (
      <div className="mt-2">
        <PillButton variant="outline" onClick={() => setReviewing(mine ? { review: mine } : { target: { productId: item.productId, productName: item.name, variantId: item.variantId, orderId: order._id } })} style={{ height: 34, padding: '0 14px', fontSize: 13 }}>
          {mine ? ts('pg.edit_your_review', 'Edit your review') : ts('pg.write_a_review', 'Write a review')}
        </PillButton>
      </div>
    );
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        {account && <ExchangeOrderBanner exchangeOf={order.exchangeOf} />}
        <TechPanel title={ts('orders.progress', 'Order progress')}><OrderTimeline order={order} /></TechPanel>
        <OrderShipments order={order} />

        <TechPanel title={ts('orders.items', 'Items')} flush>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" style={techTh()}>{ts('orders.product', 'Product')}</th>
                  <th scope="col" className="max-sm:hidden" style={{ ...techTh(), textAlign: 'end' }}>{ts('orders.price', 'Price')}</th>
                  <th scope="col" className="max-sm:hidden" style={{ ...techTh(), textAlign: 'end' }}>{ts('orders.qty', 'Qty')}</th>
                  <th scope="col" style={{ ...techTh(), textAlign: 'end' }}>{ts('orders.lineTotal', 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((item, i) => {
                  const hint = account ? returnNextStepHint(item.returnStatus) : null;
                  const returned = !!item.returnStatus && item.returnStatus !== 'none';
                  const hasExtras = account && (returned || !!item.exchangeOrderId || isDigitalItem(item));
                  return (
                    <tr key={item.itemId ?? item._id ?? i}>
                      <td style={techTd()}>
                        <div className="flex gap-3">
                          <div className="grid size-16 shrink-0 place-items-center overflow-hidden" style={{ background: t.colors.bgAlt, borderRadius: t.fieldRadiusPx }}>
                            {item.image ? <img src={item.image} alt="" className="size-full object-contain p-1" /> : <Package size={20} style={muted} aria-hidden />}
                          </div>
                          <div className="min-w-0">
                            <p className="m-0 text-[15px] font-semibold">{item.name}</p>
                            {item.options && item.options.length > 0 && <p className="m-0 mt-0.5 text-[13px]" style={muted}>{item.options.map(o => `${o.name}: ${o.value}`).join(' / ')}</p>}
                            <p className="m-0 mt-0.5 text-[13px] sm:hidden" style={muted}>{money(item.price)} x {item.quantity}</p>
                            {(item.refundedAmount ?? 0) > 0 && !(account && item.exchangeOrderId) && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.danger }}>{ts('pg.refunded_amount', 'Refunded {{amount}}', { amount: money(item.refundedAmount ?? 0) })}</p>}
                            {item.status === 'cancelled' && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.danger }}>{ts('order.cancelled', 'Cancelled')}</p>}
                            {reviewButton(item)}
                            {hasExtras && (
                              <div className="mt-2 flex flex-col items-start gap-1.5">
                                {account && <ReturnProgress status={item.returnStatus} rejectReason={item.returnRejectReason} />}
                                {account && item.exchangeOrderId && <div><ExchangeItemLink orderId={item.exchangeOrderId} orderNumber={item.exchangeOrderNumber} /></div>}
                                {hint && <p className="m-0 text-[13px]" style={muted}>{hint}</p>}
                                {account && isDigitalItem(item) && <div><OrderDownloadLink orderId={order._id} productId={item.productId} /></div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="max-sm:hidden" style={{ ...techTd(), textAlign: 'end' }}>{money(item.price)}</td>
                      <td className="max-sm:hidden" style={{ ...techTd(), textAlign: 'end' }}>{item.quantity}</td>
                      <td style={{ ...techTd(), textAlign: 'end', fontWeight: 600 }}>{money(item.totalPrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TechPanel>
        {actions}
      </div>
      {reviewing && <ReviewEditDialog review={reviewing.review} target={reviewing.target} onClose={() => setReviewing(null)} onSaved={() => { setReviewing(null); reloadReviews(); }} />}

      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24" aria-label={ts('pg.order_details', 'Order details')}>
        <TechPanel title={ts('cart.summaryTitle', 'Order summary')}>
          <dl className="m-0">
            {row(ts('checkout.subtotal', 'Subtotal'), money(orderDisplaySubtotal(order)))}
            {promoSavings > 0 && <p className="m-0 py-1 text-xs" style={muted}>{ts('pg.includes_amount_in_promotional_savings', 'Includes {{amount}} in promotional savings', { amount: money(promoSavings) })}</p>}
            {discounts.map(d => row(d.label, `-${money(d.amount)}`))}
            {row(ts('checkout.shipping', 'Shipping'), money(order.shippingFee))}
            {row(ts('checkout.tax', 'Tax'), money(order.taxAmount))}
            {(order.includedTaxAmount ?? 0) > 0 && row(ts('checkout.includingTaxes', 'Including taxes'), money(order.includedTaxAmount ?? 0))}
          </dl>
          <div className="mt-4 flex items-baseline justify-between gap-4 px-4 py-3" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.fieldRadiusPx }}>
            <span className="text-sm font-semibold uppercase" style={{ letterSpacing: '.05em' }}>{ts('checkout.total', 'Total')}</span>
            <span className="text-xl font-bold">{money(order.totalAmount)}</span>
          </div>
        </TechPanel>

        {isPickupOrder(order) ? <OrderPickupLocation order={order} /> : (
          <TechPanel title={ts('orders.shippingAddress', 'Shipping address')}>
            {addr.name || addr.lines.length > 0 ? (
              <address className="text-sm not-italic leading-relaxed">
                {addr.name && <p className="m-0 font-semibold">{addr.name}</p>}
                {addr.lines.map(l => <p key={l} className="m-0" style={muted}><bdi>{l}</bdi></p>)}
              </address>
            ) : <p className="m-0 text-sm" style={muted}>{ts('orders.noShippingAddress', 'No shipping address.')}</p>}
          </TechPanel>
        )}

        <TechPanel title={ts('orders.payment', 'Payment')}>
          <p className="m-0 mb-3 text-sm font-medium">{method || '-'}</p>
          <OrderPill badge={derivePaymentBadge(order)} />
        </TechPanel>
      </aside>
    </div>
  );
}
