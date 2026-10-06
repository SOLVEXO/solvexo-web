import type { OrderShipment, SellerOrderDetailItem } from '@/api/services/product';

/** Units of each line already covered by an existing shipment. */
export function shippedQuantities(shipments: OrderShipment[] | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sh of shipments ?? []) {
    for (const l of sh.items) out[l.itemId] = (out[l.itemId] ?? 0) + l.quantity;
  }
  return out;
}

/** A line that still has to ship: physical, not cancelled/refunded. */
export function isShippableLine(item: SellerOrderDetailItem): boolean {
  return item.type === 'physical' && item.status !== 'cancelled' && item.status !== 'refunded';
}
