import { useState, type ReactNode } from 'react';
import { ts } from '@/utils/tStatic';
import { Package } from 'lucide-react';
import type { OrderDetail } from '@/api/services/orders';
import { fashionTheme as t } from '../../theme.config';
import type { MyReviewEntry } from '@/api/services/rating';
import { Card, PillButton, SectionHeading } from '../../ui/primitives';
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
 *  `mode="public"` hides return progress, exchange links and downloads (read-only tracking). */
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

  const row = (label: string, value: string, strong = false) => (
    <div key={label} className={`flex items-baseline justify-between gap-4 ${strong ? 'text-lg font-semibold' : 'text-sm'}`}>
      <dt style={strong ? undefined : muted}>{label}</dt><dd className="m-0">{value}</dd>
    </div>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
        {account && <ExchangeOrderBanner exchangeOf={order.exchangeOf} />}
        <Card><OrderTimeline order={order} /></Card>
        <OrderShipments order={order} />

        <Card pad={false}>
          <div className="p-5 pb-0 md:px-7 md:pt-6"><SectionHeading>{ts('orders.items', 'Items')}</SectionHeading></div>
          <ul className="m-0 list-none p-0">
            {lines.map((item, i) => {
              const hint = account ? returnNextStepHint(item.returnStatus) : null;
              const returned = !!item.returnStatus && item.returnStatus !== 'none';
              const hasExtras = account && (returned || !!item.exchangeOrderId || isDigitalItem(item));
              return (
                <li key={item.itemId ?? item._id ?? i} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-4 md:px-7" style={{ borderTop: `1px solid ${t.colors.border}` }}>
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden md:size-20" style={{ background: t.colors.bgAlt, borderRadius: 14 }}>
                    {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <Package size={20} style={muted} aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[15px] font-medium">{item.name}</p>
                    {item.options && item.options.length > 0 && <p className="m-0 mt-0.5 text-[13px]" style={muted}>{item.options.map(o => `${o.name}: ${o.value}`).join(' / ')}</p>}
                    <p className="m-0 mt-0.5 text-[13px]" style={muted}>{money(item.price)} x {item.quantity}</p>
                    {(item.refundedAmount ?? 0) > 0 && !(account && item.exchangeOrderId) && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.danger }}>{ts('pg.refunded_amount', 'Refunded {{amount}}', { amount: money(item.refundedAmount ?? 0) })}</p>}
                    {item.status === 'cancelled' && <p className="m-0 mt-1 text-[13px]" style={{ color: t.colors.danger }}>{ts('order.cancelled', 'Cancelled')}</p>}
                  </div>
                  <p className="m-0 shrink-0 text-[15px] font-semibold">{money(item.totalPrice)}</p>
                  {account && ['delivered', 'completed'].includes(String(item.status)) && item.productId && (
                    <div className="basis-full pl-20 md:pl-[96px]">
                      {(() => {
                        const mine = byProduct.get(item.productId);
                        return (
                          <PillButton variant="outline" onClick={() => setReviewing(mine ? { review: mine } : { target: { productId: item.productId, productName: item.name, variantId: item.variantId, orderId: order._id } })}>
                            {mine ? ts('pg.edit_your_review', 'Edit your review') : ts('pg.write_a_review', 'Write a review')}
                          </PillButton>
                        );
                      })()}
                    </div>
                  )}
                  {hasExtras && (
                    <div className="flex basis-full flex-col items-start gap-1.5 pl-20 md:pl-[96px]">
                      {account && <ReturnProgress status={item.returnStatus} rejectReason={item.returnRejectReason} />}
                      {account && item.exchangeOrderId && <div><ExchangeItemLink orderId={item.exchangeOrderId} orderNumber={item.exchangeOrderNumber} /></div>}
                      {hint && <p className="m-0 text-[13px]" style={muted}>{hint}</p>}
                      {account && isDigitalItem(item) && <div><OrderDownloadLink orderId={order._id} productId={item.productId} /></div>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        {actions}
      </div>
      {reviewing && <ReviewEditDialog review={reviewing.review} target={reviewing.target} onClose={() => setReviewing(null)} onSaved={() => { setReviewing(null); reloadReviews(); }} />}

      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-span-4" aria-label={ts('pg.order_details', 'Order details')}>
        <Card tone="soft">
          <SectionHeading>{ts('cart.summaryTitle', 'Order summary')}</SectionHeading>
          <dl className="m-0 flex flex-col gap-2.5">
            {row(ts('checkout.subtotal', 'Subtotal'), money(orderDisplaySubtotal(order)))}
            {promoSavings > 0 && <p className="m-0 text-xs" style={muted}>{ts('pg.includes_amount_in_promotional_savings', 'Includes {{amount}} in promotional savings', { amount: money(promoSavings) })}</p>}
            {discounts.map(d => row(d.label, `-${money(d.amount)}`))}
            {row(ts('checkout.shipping', 'Shipping'), money(order.shippingFee))}
            {row(ts('checkout.tax', 'Tax'), money(order.taxAmount))}
            {(order.includedTaxAmount ?? 0) > 0 && row(ts('checkout.includingTaxes', 'Including taxes'), money(order.includedTaxAmount ?? 0))}
          </dl>
          <div className="my-4" style={{ borderTop: `1px solid ${t.colors.border}` }} />
          <dl className="m-0">{row(ts('checkout.total', 'Total'), money(order.totalAmount), true)}</dl>
        </Card>

        {isPickupOrder(order) ? <OrderPickupLocation order={order} /> : (
          <Card>
            <SectionHeading>{ts('orders.shippingAddress', 'Shipping address')}</SectionHeading>
            {addr.name || addr.lines.length > 0 ? (
              <address className="text-sm not-italic leading-relaxed">
                {addr.name && <p className="m-0 font-medium">{addr.name}</p>}
                {addr.lines.map(l => <p key={l} className="m-0" style={muted}><bdi>{l}</bdi></p>)}
              </address>
            ) : <p className="m-0 text-sm" style={muted}>{ts('orders.noShippingAddress', 'No shipping address.')}</p>}
          </Card>
        )}

        <Card>
          <SectionHeading>{ts('orders.payment', 'Payment')}</SectionHeading>
          <p className="m-0 mb-3 text-sm">{method || '-'}</p>
          <OrderPill badge={derivePaymentBadge(order)} />
        </Card>
      </aside>
    </div>
  );
}
