import { useState } from 'react';
import { Modal, Button, Field, Input } from '@/components/comman/ui';
import { apiUpdateOrderTracking } from '@/api/services/orders';

/** Edit carrier / tracking number / link of an old shipped order that has no per-shipment tracking. */
export function EditTrackingModal({ storeId, orderId, initial, onClose, onSaved }: {
  storeId: string;
  orderId: string;
  initial: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [carrier, setCarrier] = useState(initial?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(initial?.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = useState(initial?.trackingUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = () => {
    if (busy) return;
    if (!carrier.trim() && !trackingNumber.trim() && !trackingUrl.trim()) { setError('Enter a carrier, tracking number or tracking link.'); return; }
    if (trackingUrl.trim() && !/^https?:\/\//i.test(trackingUrl.trim())) { setError('The tracking link must start with http:// or https://'); return; }
    setBusy(true);
    setError('');
    apiUpdateOrderTracking(storeId, orderId, {
      carrier: carrier.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
      trackingUrl: trackingUrl.trim() || undefined,
    })
      .then(() => onSaved())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to update tracking.'))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      title="Edit tracking"
      width={460}
      onClose={() => { if (!busy) onClose(); }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={save} loading={busy}>Save tracking</Button>
        </>
      }
    >
      {error && <p role="alert" className="text-[12px] text-error mb-3">{error}</p>}
      <Field label="Carrier">
        <Input value={carrier} onChange={e => setCarrier(e.target.value)} disabled={busy} placeholder="e.g. DHL" />
      </Field>
      <Field label="Tracking number">
        <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} disabled={busy} />
      </Field>
      <Field label="Tracking link" hint="Optional.">
        <Input type="url" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} disabled={busy} placeholder="https://…" />
      </Field>
    </Modal>
  );
}
