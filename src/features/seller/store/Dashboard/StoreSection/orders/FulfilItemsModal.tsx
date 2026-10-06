import { useMemo, useState } from 'react';
import { Minus, Package, Plus } from 'lucide-react';
import { Modal, Button, Field, Input, Select } from '@/components/comman/ui';
import { apiFulfilOrderItems } from '@/api/services/orders';
import { buildTrackingUrl } from '@/api/services/shipping';
import { useShippingCarriers } from '@/hooks/shipping/useShippingCarriers';
import type { OrderShipment, SellerOrderDetailItem } from '@/api/services/product';
import { isShippableLine, shippedQuantities } from './fulfilment';
import { BuyShippingLabelModal } from './BuyShippingLabelModal';

/** Shopify "Fulfil items": pick how many units of each unfulfilled line go in this shipment, add tracking, notify. */
export function FulfilItemsModal({ storeId, orderId, orderNumber, items, shipments, onClose, onFulfilled }: {
  storeId: string;
  orderId: string;
  orderNumber: string;
  items: SellerOrderDetailItem[];
  shipments: OrderShipment[] | undefined;
  onClose: () => void;
  onFulfilled: () => void;
}) {
  const { carriers, error: carriersError, refetch: refetchCarriers } = useShippingCarriers(storeId);

  const lines = useMemo(() => {
    const shipped = shippedQuantities(shipments);
    return items
      .filter(isShippableLine)
      .map(item => ({ item, remaining: item.quantity - (shipped[item._id] ?? 0) }))
      .filter(l => l.remaining > 0);
  }, [items, shipments]);

  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map(l => [l.item._id, l.remaining])));
  const [carrierId, setCarrierId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [notify, setNotify] = useState(true);
  // 'label' = buy a Shippo label for ONLY the selected items (creates the shipment itself).
  const [mode, setMode] = useState<'manual' | 'label'>('manual');
  const [labelItems, setLabelItems] = useState<{ itemId: string; quantity: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedCount = lines.reduce((n, l) => n + (qty[l.item._id] ?? 0), 0);
  const activeCarriers = carriers.filter(c => c.isActive);

  const setLineQty = (id: string, remaining: number, next: number) =>
    setQty(q => ({ ...q, [id]: Math.max(0, Math.min(remaining, Number.isFinite(next) ? Math.floor(next) : 0)) }));

  const submit = () => {
    if (busy) return;
    const chosen = lines
      .map(l => ({ itemId: l.item._id, quantity: qty[l.item._id] ?? 0 }))
      .filter(l => l.quantity > 0);
    if (chosen.length === 0) { setError('Select at least one item to fulfil.'); return; }
    if (mode === 'label') { setError(''); setLabelItems(chosen); return; }
    setBusy(true);
    setError('');
    apiFulfilOrderItems(storeId, orderId, {
      items: chosen,
      carrier: carrier.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
      trackingUrl: trackingUrl.trim() || undefined,
      notifyCustomer: notify,
    })
      .then(() => onFulfilled())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to fulfil items.'))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      title={`Fulfil items — ${orderNumber}`}
      width={560}
      onClose={() => { if (!busy) onClose(); }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} loading={busy} disabled={lines.length === 0 || selectedCount === 0}>
            {mode === 'label' ? 'Choose shipping label' : `Fulfil ${selectedCount > 0 ? `${selectedCount} item${selectedCount === 1 ? '' : 's'}` : 'items'}`}
          </Button>
        </>
      }
    >
      {error && <p role="alert" className="text-[12px] text-error mb-3">{error}</p>}

      {lines.length === 0 ? (
        <p className="text-[12.5px] text-slate">Every item on this order is already fulfilled.</p>
      ) : (
        <>
          <p className="text-[12.5px] text-slate mb-3">Choose how many units go in this shipment. Anything you leave out stays unfulfilled and can ship later.</p>
          <div className="flex flex-col border border-bone rounded-[10px] mb-4">
            {lines.map(({ item, remaining }) => {
              const value = qty[item._id] ?? 0;
              return (
                <div key={item._id} className="flex items-center gap-3 px-3 py-2.5 border-b border-bone last:border-b-0">
                  <div className="w-10 h-10 rounded-lg bg-cream border border-bone shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-slate" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.name}</p>
                    <p className="text-[11px] text-slate truncate">
                      {item.options.length > 0 ? item.options.map(o => `${o.name}: ${o.value}`).join(' · ') + ' · ' : ''}
                      {item.sku ? `SKU: ${item.sku} · ` : ''}{remaining} unfulfilled
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => setLineQty(item._id, remaining, value - 1)}
                      disabled={busy || value <= 0}
                      className="w-7 h-7 rounded-md border border-bone bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"
                    ><Minus size={12} /></button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={remaining}
                      aria-label={`Quantity of ${item.name} to fulfil`}
                      value={value}
                      onChange={e => setLineQty(item._id, remaining, parseInt(e.target.value, 10))}
                      disabled={busy}
                      className="w-12 h-7 text-center text-[12.5px] border border-bone rounded-md bg-white"
                    />
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => setLineQty(item._id, remaining, value + 1)}
                      disabled={busy || value >= remaining}
                      className="w-7 h-7 rounded-md border border-bone bg-white flex items-center justify-center cursor-pointer disabled:opacity-40"
                    ><Plus size={12} /></button>
                    <span className="text-[11px] text-slate ml-1 w-9">of {remaining}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[12px] font-bold text-charcoal uppercase tracking-[0.05em] mb-2">Tracking information</p>
          <div className="flex flex-col gap-1.5 mb-3" role="radiogroup" aria-label="How to add tracking">
            <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
              <input type="radio" name="fulfil-mode" checked={mode === 'manual'} onChange={() => setMode('manual')} disabled={busy} />
              Enter tracking details myself
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
              <input type="radio" name="fulfil-mode" checked={mode === 'label'} onChange={() => setMode('label')} disabled={busy} />
              Buy a shipping label for these items
            </label>
          </div>
          {mode === 'label' && (
            <p className="text-[11.5px] text-slate mb-3">
              Next step: pick a package and carrier rate. The rate is calculated from the weight of only the selected items, and buying the label fulfils them.
            </p>
          )}
          {mode === 'manual' && carriersError && (
            <p className="text-[11.5px] text-slate mb-2">
              Couldn't load your saved carriers.{' '}
              <button type="button" onClick={refetchCarriers} className="text-brand-orange underline bg-transparent border-none p-0 cursor-pointer">Retry</button>
            </p>
          )}
          {mode === 'manual' && activeCarriers.length > 0 && (
            <Field label="Carrier" hint="Pick a saved carrier to auto-build the tracking link, or choose Other.">
              <Select
                value={carrierId}
                disabled={busy}
                onChange={e => {
                  const id = e.target.value;
                  setCarrierId(id);
                  const picked = activeCarriers.find(c => c._id === id);
                  setCarrier(picked ? picked.name : '');
                  if (picked?.trackingUrlTemplate) setTrackingUrl(buildTrackingUrl(picked.trackingUrlTemplate, trackingNumber));
                }}
              >
                <option value="">Other (type manually)</option>
                {activeCarriers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          {mode === 'manual' && (activeCarriers.length === 0 || carrierId === '') && (
            <Field label="Carrier name">
              <Input placeholder="e.g. DHL, FedEx, Local Courier" value={carrier} onChange={e => setCarrier(e.target.value)} disabled={busy} />
            </Field>
          )}
          {mode === 'manual' && (<>
          <Field label="Tracking number" hint="Optional.">
            <Input
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingNumber}
              onChange={e => {
                const value = e.target.value;
                setTrackingNumber(value);
                const picked = activeCarriers.find(c => c._id === carrierId);
                if (picked?.trackingUrlTemplate) setTrackingUrl(buildTrackingUrl(picked.trackingUrlTemplate, value));
              }}
              disabled={busy}
            />
          </Field>
          <Field label="Tracking link" hint="Optional — lets the customer open the carrier's tracking page.">
            <Input type="url" placeholder="https://…" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} disabled={busy} />
          </Field>
          </>)}

          <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer mt-1">
            <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} disabled={busy} />
            Send shipment details to the customer
          </label>
        </>
      )}
      {labelItems && (
        <BuyShippingLabelModal
          storeId={storeId}
          orderId={orderId}
          orderNumber={orderNumber}
          items={labelItems}
          notifyCustomer={notify}
          onClose={() => setLabelItems(null)}
          onPurchased={() => { setLabelItems(null); onFulfilled(); }}
        />
      )}
    </Modal>
  );
}
