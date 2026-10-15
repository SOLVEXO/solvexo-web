import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, Store } from 'lucide-react';
import type { OrderDetail } from '@/api/services/orders';
import { collectShipments, formatOrderDate, isPickupOrder, pickupInfo, safeTrackingUrl } from './orderUi';

/** Style tokens a theme passes in so the same fulfilment blocks render in both themes and on the public status page. */
export interface FulfilmentLook {
  card: CSSProperties;
  h2: CSSProperties;
  body: CSSProperties;
  muted: CSSProperties;
  accent: string;
  /** Bold weight used for emphasised text in the theme. */
  strong: number;
}

/** Buyer-facing shipments: one card per shipment (items, carrier, tracking, link); pickup orders show nothing here. */
export function OrderShipments({ order, look }: { order: OrderDetail; look: FulfilmentLook }) {
  const { t: tr } = useTranslation('storefront');
  if (isPickupOrder(order)) return null;
  const shipments = collectShipments(order);
  if (shipments.length === 0) return null;
  const many = shipments.length > 1;
  return (
    <>
      {shipments.map((sh, i) => {
        const url = safeTrackingUrl(sh.trackingUrl);
        return (
          <section key={sh.key} style={look.card} aria-label={many ? tr('orders.shipmentN', 'Shipment {{n}}', { n: i + 1 }) : tr('orders.tracking', "Tracking")}>
            <p style={{ ...look.h2, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={15} style={{ color: look.accent }} /> {many ? tr('orders.shipmentNofM', 'Shipment {{n}} of {{total}}', { n: i + 1, total: shipments.length }) : tr('orders.tracking', "Tracking")}
            </p>
            {sh.items.length > 0 && (
              <ul style={{ ...look.body, listStyle: 'none', margin: '0 0 8px', padding: 0 }}>
                {sh.items.map(line => <li key={line}>{line}</li>)}
              </ul>
            )}
            {sh.carrier && <p style={look.body}>{tr('orders.carrier', "Carrier")}: {sh.carrier}</p>}
            {sh.trackingNumber && <p style={{ ...look.body, marginTop: '4px' }}>{tr('orders.trackingNumber', "Tracking number")}: <span style={{ fontFamily: 'monospace' }}>{sh.trackingNumber}</span></p>}
            {(sh.shippedAt || sh.deliveredAt) && (
              <p style={{ ...look.muted, marginTop: '6px' }}>
                {sh.deliveredAt ? tr('orders.deliveredOn', 'Delivered {{date}}', { date: formatOrderDate(sh.deliveredAt) }) : tr('orders.shippedOn', 'Shipped {{date}}', { date: formatOrderDate(sh.shippedAt) })}
              </p>
            )}
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block underline" style={{ ...look.body, fontWeight: look.strong, marginTop: '10px' }}>
                {tr('orders.trackPackage', "Track package")}
              </a>
            )}
          </section>
        );
      })}
    </>
  );
}

/** "Pickup location" block that replaces the shipping address card for local-pickup orders. */
export function OrderPickupLocation({ order, look }: { order: OrderDetail; look: FulfilmentLook }) {
  const { t: tr } = useTranslation('storefront');
  const p = pickupInfo(order);
  const subs = order.sellerOrders ?? [];
  const ready = subs.some(s => s.pickupReadyAt || ['shipped', 'delivered', 'completed'].includes(String(s.status)));
  const pickedUp = subs.length > 0 && subs.every(s => ['delivered', 'completed'].includes(String(s.status)));
  return (
    <section style={{ ...look.card, marginBottom: 0 }}>
      <p style={{ ...look.h2, display: 'flex', alignItems: 'center', gap: '8px' }}><Store size={15} style={{ color: look.accent }} /> {tr('orders.pickupLocation', "Pickup location")}</p>
      {p.name || p.address || p.instructions ? (
        <>
          {p.name && <p style={{ ...look.body, fontWeight: look.strong }}>{p.name}</p>}
          {p.address && <p style={{ ...look.muted, marginTop: '2px' }}>{p.address}</p>}
          {p.instructions && <p style={{ ...look.muted, marginTop: '8px' }}>{p.instructions}</p>}
        </>
      ) : <p style={look.muted}>{tr('orders.pickupDetailsLater', "Pickup details will be shared by the store.")}</p>}
      <p style={{ ...look.body, fontWeight: look.strong, marginTop: '10px' }}>
        {pickedUp ? tr('orders.wasPickedUp', "Your order was picked up.") : ready ? tr('orders.readyPickup', "Your order is ready for pickup.") : tr('orders.willNotify', "We will let you know when your order is ready for pickup.")}
      </p>
    </section>
  );
}
