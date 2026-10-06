import type { OrderDetail, OrderLineItem, OrderStatus, OrderSummary } from '@/api/services/orders';

/** Shared (theme-agnostic) helpers for the buyer "Orders" / "Order" pages. */

export type BadgeTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

export const BADGE_TONE_COLOR: Record<BadgeTone, string> = {
  success: '#1A6B35',
  warning: '#B36200',
  info: '#1A65A8',
  danger: '#C0392B',
  neutral: '#5F6368',
};

export interface OrderBadgeInfo { label: string; tone: BadgeTone }

type ItemGroups = { stores?: { items?: { status?: string }[] }[]; sellerOrders?: { items?: { status?: string }[] }[] };
type PaymentSource = Pick<OrderSummary, 'paymentStatus' | 'isPaid'> & ItemGroups;
type FulfillmentSource = { orderStatus: OrderStatus; fulfillmentMethod?: 'ship' | 'pickup' } & ItemGroups;

/** Status of every line item, from the order summary (`stores`) or the order document (`sellerOrders`). */
function itemStatuses(order: ItemGroups): string[] {
  const groups = order.stores ?? order.sellerOrders ?? [];
  return groups.flatMap(g => (g.items ?? []).map(i => String(i.status ?? '')));
}

const FULFILLED_ITEM = ['shipped', 'delivered', 'completed'];

/** Shopify's payment statuses: Pending, Authorized, Partially paid, Paid, Partially refunded, Refunded, Voided.
 *  Solvexo's stored values: unpaid / pending_verification (-> Pending), authorized, partially_paid, paid, refunded, failed.
 *  A cancellation sets the stored status to 'refunded' even when only SOME items were cancelled — that is shown as
 *  "Partially refunded", exactly as Shopify does, unless every line was cancelled. */
export function derivePaymentBadge(order: PaymentSource): OrderBadgeInfo {
  const s = String(order.paymentStatus ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (s.includes('refund')) {
    const items = itemStatuses(order);
    const someCancelled = items.some(x => x === 'cancelled');
    const allCancelled = items.length > 0 && items.every(x => x === 'cancelled');
    if (s.includes('partial') || (someCancelled && !allCancelled)) return { label: 'Partially refunded', tone: 'warning' };
    return { label: 'Refunded', tone: 'neutral' };
  }
  if (s === 'failed' || s === 'voided') return { label: 'Voided', tone: 'danger' };
  if (s.includes('authoriz')) return { label: 'Authorized', tone: 'info' };
  if (s === 'partially_paid') return { label: 'Partially paid', tone: 'warning' };
  if (order.isPaid || s === 'paid') return { label: 'Paid', tone: 'success' };
  return { label: 'Pending', tone: 'warning' };
}

/** Shopify's fulfillment statuses: Unfulfilled, Partially fulfilled, Fulfilled (shipped counts as fulfilled — delivery
 *  progress is shown on the tracking card, not here). A fully cancelled order shows Cancelled. */
export function deriveFulfillmentBadge(order: FulfillmentSource): OrderBadgeInfo {
  if (order.orderStatus === 'cancelled') return { label: 'Cancelled', tone: 'danger' };
  const live = itemStatuses(order).filter(x => x && x !== 'cancelled');
  // Local pickup: "shipped" means the order is waiting for the customer at the pickup point.
  if (order.fulfillmentMethod === 'pickup') {
    const pickedUp = live.length > 0 ? live.every(x => x === 'delivered' || x === 'completed') : ['delivered', 'completed'].includes(order.orderStatus);
    if (pickedUp) return { label: 'Picked up', tone: 'success' };
    const ready = live.length > 0 ? live.every(x => FULFILLED_ITEM.includes(x)) : order.orderStatus === 'shipped';
    return ready ? { label: 'Ready for pickup', tone: 'info' } : { label: 'Unfulfilled', tone: 'warning' };
  }
  if (live.length > 0) {
    const done = live.filter(x => FULFILLED_ITEM.includes(x)).length;
    if (done === live.length) return { label: 'Fulfilled', tone: 'success' };
    if (done > 0) return { label: 'Partially fulfilled', tone: 'info' };
    return { label: 'Unfulfilled', tone: 'warning' };
  }
  return FULFILLED_ITEM.includes(order.orderStatus)
    ? { label: 'Fulfilled', tone: 'success' }
    : { label: 'Unfulfilled', tone: 'warning' };
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash_on_delivery: 'Cash on delivery',
  stripe: 'Card',
  manual_bank_transfer: 'Bank transfer',
  store_credit: 'Store credit',
};

export function paymentMethodLabel(paymentType: string | undefined | null): string {
  if (!paymentType) return '';
  return PAYMENT_METHOD_LABEL[paymentType] ?? paymentType;
}

export function formatOrderDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return withTime
    ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface TimelineStep { label: string; date: string; done: boolean }

function earliest(dates: (string | null | undefined)[]): string | null {
  const ts = dates.filter((d): d is string => !!d && !Number.isNaN(new Date(d).getTime()));
  if (ts.length === 0) return null;
  return ts.reduce((a, b) => (new Date(a) <= new Date(b) ? a : b));
}
function latest(dates: (string | null | undefined)[]): string | null {
  const ts = dates.filter((d): d is string => !!d && !Number.isNaN(new Date(d).getTime()));
  if (ts.length === 0) return null;
  return ts.reduce((a, b) => (new Date(a) >= new Date(b) ? a : b));
}

export function isPickupOrder(order: { fulfillmentMethod?: 'ship' | 'pickup' }): boolean {
  return order.fulfillmentMethod === 'pickup';
}

/** Ordered -> Paid -> Shipped -> Delivered (pickup: Ready for pickup -> Picked up); Cancelled replaces the tail when cancelled. */
export function buildOrderTimeline(order: OrderDetail): TimelineStep[] {
  const subs = order.sellerOrders ?? [];
  const shippedAt = earliest(subs.map(s => s.shippedAt));
  const deliveredAt = latest(subs.map(s => s.deliveredAt));
  const pickup = isPickupOrder(order);
  const partlyShipped = !pickup && subs.some(s => (s.shipments?.length ?? 0) > 0 && !['shipped', 'delivered', 'completed'].includes(String(s.status)));
  const steps: TimelineStep[] = [{ label: 'Ordered', date: formatOrderDate(order.createdAt), done: true }];
  if (order.orderStatus === 'cancelled') {
    steps.push({ label: 'Cancelled', date: '', done: true });
    return steps;
  }
  const payLabel = derivePaymentBadge(order).label;
  const paid = !!order.paidAt || payLabel === 'Paid' || payLabel === 'Refunded' || payLabel === 'Partially refunded';
  const shipped = !!shippedAt || ['shipped', 'delivered', 'completed'].includes(order.orderStatus);
  const delivered = !!deliveredAt || ['delivered', 'completed'].includes(order.orderStatus);
  steps.push({ label: 'Paid', date: formatOrderDate(order.paidAt), done: paid });
  steps.push({ label: pickup ? 'Ready for pickup' : partlyShipped ? 'Partially shipped' : 'Shipped', date: formatOrderDate(pickup ? (earliest(subs.map(s => s.pickupReadyAt)) ?? shippedAt) : shippedAt), done: shipped });
  steps.push({ label: pickup ? 'Picked up' : 'Delivered', date: formatOrderDate(deliveredAt), done: delivered });
  return steps;
}

export interface BuyerShipment {
  key: string;
  /** "2 × Blue shirt" lines; empty for a legacy single-tracking record (covers the whole sub-order). */
  items: string[];
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

/** Every shipment with tracking info, one per entry; falls back to the sub-order's single legacy `tracking` when it has no shipments. */
export function collectShipments(order: Pick<OrderDetail, 'sellerOrders'>): BuyerShipment[] {
  const out: BuyerShipment[] = [];
  (order.sellerOrders ?? []).forEach((s, si) => {
    const shipments = s.shipments ?? [];
    if (shipments.length > 0) {
      shipments.forEach((sh, i) => {
        out.push({
          key: sh._id ?? `${si}-${i}`,
          items: (sh.items ?? []).map(l => {
            const item = (s.items ?? []).find(it => (it.itemId ?? it._id) === l.itemId);
            return `${l.quantity} × ${item?.name ?? 'Item'}`;
          }),
          carrier: sh.tracking?.carrier ?? null,
          trackingNumber: sh.tracking?.trackingNumber ?? null,
          trackingUrl: sh.tracking?.trackingUrl ?? null,
          shippedAt: sh.shippedAt ?? null,
          deliveredAt: sh.deliveredAt ?? null,
        });
      });
    } else if (s.tracking && (s.tracking.carrier || s.tracking.trackingNumber)) {
      out.push({
        key: s._id ?? `legacy-${si}`,
        items: [],
        carrier: s.tracking.carrier ?? null,
        trackingNumber: s.tracking.trackingNumber ?? null,
        trackingUrl: s.tracking.trackingUrl ?? null,
        shippedAt: s.shippedAt ?? null,
        deliveredAt: s.deliveredAt ?? null,
      });
    }
  });
  return out;
}

export interface PickupInfoLines { name: string; address: string; instructions: string }

export function pickupInfo(order: { pickupLocation?: { name: string | null; address: string | null; instructions: string | null } | null }): PickupInfoLines {
  const p = order.pickupLocation;
  return { name: p?.name?.trim() ?? '', address: p?.address?.trim() ?? '', instructions: p?.instructions?.trim() ?? '' };
}

/** A "Request a return" action is only offered once the order was delivered. */
export function canRequestReturn(order: Pick<OrderDetail, 'orderStatus'>): boolean {
  return order.orderStatus === 'delivered' || order.orderStatus === 'completed';
}

export function isDigitalItem(item: OrderLineItem): boolean {
  return item.type === 'digital' || item.productType === 'digital';
}

/** Only http(s) tracking URLs may be linked out (blocks javascript: etc.). */
export function safeTrackingUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

export interface AddressLines { name: string; lines: string[] }

export function formatShippingAddress(addr: Record<string, unknown> | null | undefined): AddressLines {
  const a = addr ?? {};
  const str = (k: string) => (typeof a[k] === 'string' ? (a[k] as string).trim() : '');
  const cityLine = [str('city'), str('state'), str('zipCode')].filter(Boolean).join(', ');
  const lines = [str('address'), str('addressLine1'), str('addressLine2'), cityLine, str('country'), str('phoneNumber')].filter(Boolean);
  return { name: str('recipientName'), lines };
}
