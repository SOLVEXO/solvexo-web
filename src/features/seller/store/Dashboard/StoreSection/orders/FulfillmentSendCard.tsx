import { useEffect, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { apiListFulfillmentServices, apiSendOrderToFulfillment, type FulfillmentServiceRow } from '@/api/services/fulfillmentServices';

/** Order detail: hand this order to a connected fulfilment service (3PL). Hidden when none is connected. */
export default function FulfillmentSendCard({ storeId, orderId }: { storeId: string; orderId: string }) {
  const toast = useToast();
  const [services, setServices] = useState<FulfillmentServiceRow[]>([]);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let off = false;
    apiListFulfillmentServices(storeId).then((s) => { if (!off) { const act = s.filter((x) => x.status === 'active'); setServices(act); setChoice(act[0]?._id ?? ''); } }).catch(() => { /* no access or none: the card stays hidden */ });
    return () => { off = true; };
  }, [storeId]);

  if (!services.length) return null;
  const send = async () => {
    setBusy(true);
    try { await apiSendOrderToFulfillment(storeId, orderId, choice); setSent(true); toast.success('Order sent to the fulfilment service'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Could not send the order.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[13.5px] font-semibold text-charcoal"><Warehouse size={15} aria-hidden /> Fulfilment service</div>
      <p className="text-[12.5px] text-slate m-0">Send the unshipped items to your warehouse. Tracking comes back automatically.</p>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Fulfilment service" className="h-9 rounded-lg border border-border-soft px-2 text-[13px]" value={choice} onChange={(e) => setChoice(e.target.value)}>
          {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <Button size="sm" onClick={send} loading={busy} disabled={!choice || sent}>{sent ? 'Sent' : 'Send order'}</Button>
      </div>
    </div>
  );
}
