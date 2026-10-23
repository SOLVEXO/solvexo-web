import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, RefreshCw, Store, Truck } from 'lucide-react';
import { apiGetDownloadLink, type OrderDetail } from '@/api/services/orders';
import { ts, tt } from '@/utils/tStatic';
import { collectShipments, formatOrderDate, isPickupOrder, pickupInfo, safeTrackingUrl } from '../../../orderUi';
import { fashionTheme as t } from '../../theme.config';
import { Card } from '../../ui/primitives';

const muted = { color: t.colors.inkMuted } as const;

/** One card per shipment (items, carrier, tracking number, track link). Pickup orders render nothing here. */
export function OrderShipments({ order }: { order: OrderDetail }) {
  const { t: tr } = useTranslation('storefront');
  if (isPickupOrder(order)) return null;
  const shipments = collectShipments(order);
  if (shipments.length === 0) return null;
  const many = shipments.length > 1;
  const heading = tr('orders.tracking', 'Tracking');
  return (
    <>
      {shipments.map((sh, i) => {
        const url = safeTrackingUrl(sh.trackingUrl);
        const title = many ? tr('orders.shipmentNofM', 'Shipment {{n}} of {{total}}', { n: i + 1, total: shipments.length }) : heading;
        return (
          <Card key={sh.key}>
            <section aria-label={many ? tr('orders.shipmentN', 'Shipment {{n}}', { n: i + 1 }) : heading}>
              <h2 className="m-0 mb-3 flex items-center gap-2 text-base font-semibold"><Truck size={16} aria-hidden /> {title}</h2>
              {sh.items.length > 0 && <ul className="m-0 mb-2 list-none p-0 text-sm">{sh.items.map(line => <li key={line}>{line}</li>)}</ul>}
              {sh.carrier && <p className="m-0 text-sm">{tr('orders.carrier', 'Carrier')}: {sh.carrier}</p>}
              {sh.trackingNumber && <p className="m-0 mt-1 text-sm">{tr('orders.trackingNumber', 'Tracking number')}: <span className="font-mono">{sh.trackingNumber}</span></p>}
              {(sh.shippedAt || sh.deliveredAt) && (
                <p className="m-0 mt-1.5 text-[13px]" style={muted}>
                  {sh.deliveredAt ? tr('orders.deliveredOn', 'Delivered {{date}}', { date: formatOrderDate(sh.deliveredAt) }) : tr('orders.shippedOn', 'Shipped {{date}}', { date: formatOrderDate(sh.shippedAt) })}
                </p>
              )}
              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold underline" style={{ color: t.colors.ink }}>{tr('orders.trackPackage', 'Track package')}</a>}
            </section>
          </Card>
        );
      })}
    </>
  );
}

/** Replaces the shipping address card for local-pickup orders. */
export function OrderPickupLocation({ order }: { order: OrderDetail }) {
  const { t: tr } = useTranslation('storefront');
  const p = pickupInfo(order);
  const subs = order.sellerOrders ?? [];
  const ready = subs.some(s => s.pickupReadyAt || ['shipped', 'delivered', 'completed'].includes(String(s.status)));
  const pickedUp = subs.length > 0 && subs.every(s => ['delivered', 'completed'].includes(String(s.status)));
  return (
    <Card>
      <h2 className="m-0 mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight"><Store size={16} aria-hidden /> {tr('orders.pickupLocation', 'Pickup location')}</h2>
      {p.name || p.address || p.instructions ? (
        <>
          {p.name && <p className="m-0 text-sm font-semibold">{p.name}</p>}
          {p.address && <p className="m-0 mt-0.5 text-[13px]" style={muted}>{p.address}</p>}
          {p.instructions && <p className="m-0 mt-2 text-[13px]" style={muted}>{p.instructions}</p>}
        </>
      ) : <p className="m-0 text-[13px]" style={muted}>{tr('orders.pickupDetailsLater', 'Pickup details will be shared by the store.')}</p>}
      <p className="m-0 mt-3 text-sm font-semibold">
        {pickedUp ? tr('orders.wasPickedUp', 'Your order was picked up.') : ready ? tr('orders.readyPickup', 'Your order is ready for pickup.') : tr('orders.willNotify', 'We will let you know when your order is ready for pickup.')}
      </p>
    </Card>
  );
}

/** "Replacement for order #X" banner on an exchange order. */
export function ExchangeOrderBanner({ exchangeOf }: { exchangeOf: { orderId: string; orderNumber: string } | null | undefined }) {
  if (!exchangeOf) return null;
  return (
    <div role="status" className="flex items-center gap-3 px-4 py-3 text-sm" style={{ borderRadius: 14, background: t.colors.bgAlt, color: t.colors.ink }}>
      <RefreshCw size={16} aria-hidden className="shrink-0" />
      <span>{ts('pg.this_is_the_replacement_order_for', 'This is the replacement order for')} <Link to={`/orders/${exchangeOf.orderId}`} className="font-semibold underline" style={{ color: t.colors.ink }}>#{exchangeOf.orderNumber}</Link>.</span>
    </div>
  );
}

/** Link from a returned line to the exchange order that resolved it. */
export function ExchangeItemLink({ orderId, orderNumber }: { orderId: string | null | undefined; orderNumber?: string | null }) {
  if (!orderId) return null;
  return (
    <Link to={`/orders/${orderId}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold underline" style={{ color: t.colors.ink }}>
      <RefreshCw size={12} aria-hidden /> {ts('pg.exchange_order', 'Exchange order')}{orderNumber ? ` #${orderNumber}` : ''}
    </Link>
  );
}

const STEPS = [tt('returns.step.requested', 'Requested'), tt('returns.step.approved', 'Approved'), tt('returns.step.received', 'Received')];

function stepIndex(status: string): number {
  switch (status) {
    case 'requested': return 0;
    case 'approved': return 1;
    case 'received': return 2;
    case 'refunded': case 'exchanged': case 'closed': return 3;
    default: return -1;
  }
}

/** Return path of a returned line: Requested, Approved, Received, then Refunded / Exchanged / Closed. */
export function ReturnProgress({ status, rejectReason }: { status: string | undefined | null; rejectReason?: string | null }) {
  if (!status || status === 'none') return null;
  if (status === 'rejected') {
    return <p role="status" className="m-0 mt-2 text-[13px]" style={muted}>{tt('returns.declinedMsg', 'Your return request was declined')}{rejectReason ? `: ${rejectReason}` : '.'}</p>;
  }
  const idx = stepIndex(status);
  const final = status === 'exchanged' ? tt('returns.step.exchanged', 'Exchanged') : status === 'closed' ? tt('returns.step.closed', 'Closed') : tt('returns.step.refunded', 'Refunded');
  return (
    <ol aria-label={tt('returns.progress', 'Return progress')} className="m-0 mt-2.5 flex list-none flex-wrap items-center gap-1.5 p-0">
      {[...STEPS, final].map((label, k) => {
        const done = k <= idx;
        return (
          <li key={label} aria-current={k === idx ? 'step' : undefined} className="px-3 py-1 text-xs" style={{ borderRadius: 999, fontWeight: done ? 600 : 400, background: done ? t.colors.selected : t.colors.bgAlt, color: done ? t.colors.selectedInk : t.colors.inkMuted }}>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Digital item download; a failure is shown instead of swallowed. */
export function OrderDownloadLink({ orderId, productId }: { orderId: string; productId: string }) {
  const { t: tr } = useTranslation('storefront');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiGetDownloadLink(orderId, productId, 0);
      window.open(`${import.meta.env.VITE_API_URL as string}${res.data.endpoint}?token=${res.data.token}`, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('orders.err.download', 'Download failed.'));
    } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => void handle()} disabled={busy} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold underline" style={{ color: t.colors.ink }}>
        {busy ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Download size={13} aria-hidden />} {tr('orders.download', 'Download')}
      </button>
      {error && <span role="alert" className="text-xs" style={{ color: t.colors.danger }}>{error}</span>}
    </span>
  );
}