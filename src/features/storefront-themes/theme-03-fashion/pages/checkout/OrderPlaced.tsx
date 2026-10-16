import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { OrderPlacedActions } from './OrderPlacedActions';
import { Card, Page } from '../../ui/primitives';
import type { PlacedLike } from '../../../core/checkout/checkoutApi';
import { moneyText } from '../../../core/checkout/checkoutMath';

interface Props {
  orders: PlacedLike[];
  storeName: string;
  /** null = signed-in buyer; a string (possibly empty) = guest, shows the "create an account" nudge. */
  guestEmail: string | null;
  /** True when this screen follows a hosted-gateway / card confirmation rather than a direct placement. */
  paymentConfirmed?: boolean;
}

/** Order confirmation: shared by the checkout page and the gateway return page. */
export function OrderPlaced({ orders, storeName, guestEmail, paymentConfirmed }: Props) {
  const unpaid = orders.some(o => o.isPaid === false);
  const cashOnly = unpaid && orders.filter(o => o.isPaid === false).every(o => o.paymentMethod === 'cash_on_delivery');
  const unpaidNote = cashOnly ? ' Pay in cash when it arrives.' : ' It will be confirmed once the store receives your payment.';
  return (
    <Page narrow>
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${t.colors.success} 14%, transparent)`, color: t.colors.success }}><Check size={30} aria-hidden /></span>
        <h1 className="m-0 text-[clamp(28px,4vw,44px)] font-medium leading-[1.1] tracking-tight">Thank you for your <span className="fx-serif">order</span></h1>
        <p className="m-0 max-w-[460px] text-base" style={{ color: t.colors.inkMuted }}>
          {paymentConfirmed ? `Your payment was confirmed and your order at ${storeName} has been placed.` : `Your order at ${storeName} has been placed.`}
          {unpaid ? unpaidNote : ''}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {orders.map(o => (
          <Card key={o.orderId}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>Order <strong style={{ color: t.colors.ink }}>{o.orderNumber}</strong></p>
              <p className="m-0 text-lg font-semibold">{moneyText(o.summary.total, o.currency)}</p>
            </div>
            {o.items && o.items.length > 0 && (
              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-sm">
                {o.items.map((it, i) => (
                  <li key={`${it.sku}-${i}`} className="flex justify-between gap-3"><span className="min-w-0 truncate" style={{ color: t.colors.inkMuted }}>{it.name} x{it.quantity}</span><span className="shrink-0">{moneyText(it.totalPrice, o.currency)}</span></li>
                ))}
              </ul>
            )}
            {o.deliveryAddress?.addressLine1 && (
              <p className="m-0 mt-4 text-sm" style={{ color: t.colors.inkMuted }}>
                Delivering to {o.deliveryAddress.recipientName}, {o.deliveryAddress.addressLine1}, {o.deliveryAddress.city}
              </p>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <OrderPlacedActions orderId={orders[0]?.orderId} guestEmail={guestEmail} />
        <Link to="/" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>Continue shopping</Link>
      </div>
    </Page>
  );
}
