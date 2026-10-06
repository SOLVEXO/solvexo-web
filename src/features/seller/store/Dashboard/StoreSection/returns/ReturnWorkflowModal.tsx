import { useState } from 'react';
import { Modal, Textarea, Button } from '@/components/comman/ui';
import { apiReturnAction, apiReceiveReturn, apiRefundReturn } from '@/api/services/orders';
import { useToast } from '@/contexts/ToastContext';
import type { ReturnWorkflowMode } from './returnStatus';

export interface ReturnWorkflowLine {
  itemId: string;
  name: string;
  quantity: number;
  reason?: string | null;
}

interface Props {
  mode: ReturnWorkflowMode;
  storeId: string;
  orderId: string;
  orderNumber: string;
  lines: ReturnWorkflowLine[];
  /** Orders that were never paid have nothing to refund (the line is just marked refunded). */
  isPaid?: boolean;
  customerName?: string;
  onClose: () => void;
  onDone: () => void;
}

const TITLES: Record<ReturnWorkflowMode, string> = {
  review: 'Review return',
  receive: 'Mark return as received',
  refund: 'Refund return',
  close: 'Close return',
};

function Choice<T extends string>({ value, current, onPick, label, hint, disabled }: { value: T; current: T; onPick: (v: T) => void; label: string; hint?: string; disabled?: boolean }) {
  const on = value === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onPick(value)}
      className={`text-left rounded-[8px] px-3 py-2 cursor-pointer border transition-colors ${on ? 'bg-brand-pale-orange border-brand-orange' : 'bg-white border-bone hover:bg-cream'}`}
    >
      <span className={`block text-[12.5px] font-medium ${on ? 'text-brand-deep-orange' : 'text-charcoal'}`}>{label}</span>
      {hint && <span className="block text-[11.5px] text-slate mt-0.5">{hint}</span>}
    </button>
  );
}

/**
 * One dialog for the seller steps of the Shopify returns flow:
 *  review  -> Approve (no money / stock moves) or Decline (reason required)
 *  receive -> goods arrived, choose what happens to the stock
 *  refund  -> refund the received lines (original payment method or store credit)
 *  close   -> end an approved/received return without a refund
 * Exchange is a separate dialog on the order page.
 */
export function ReturnWorkflowModal({ mode, storeId, orderId, orderNumber, lines, isPaid = true, customerName, onClose, onDone }: Props) {
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState<'restock' | 'damaged' | 'none'>('restock');
  const [refundTo, setRefundTo] = useState<'original' | 'store_credit'>('original');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const itemIds = lines.map(l => l.itemId);

  const run = async (fn: () => Promise<{ message?: string }>) => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fn();
      toast.success(res.message || 'Done');
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const approve = () => run(() => apiReturnAction(orderId, { storeId, itemIds, action: 'approve' }));
  const decline = () => {
    if (!reason.trim()) { setError('Please give the customer a reason.'); return; }
    return run(() => apiReturnAction(orderId, { storeId, itemIds, action: 'reject', rejectReason: reason.trim() }));
  };
  const receive = () => run(() => apiReceiveReturn(storeId, orderId, { itemIds, restock }));
  const refund = () => run(() => apiRefundReturn(storeId, orderId, { itemIds, refundTo }));
  const close = () => run(() => apiReturnAction(orderId, { storeId, itemIds, action: 'close', rejectReason: reason.trim() || undefined }));

  let footer;
  if (mode === 'review') {
    footer = declining ? (
      <>
        <Button variant="outline" onClick={() => { setDeclining(false); setError(''); }} disabled={saving}>Back</Button>
        <Button variant="danger" onClick={decline} loading={saving}>Decline return</Button>
      </>
    ) : (
      <>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="danger" onClick={() => { setDeclining(true); setError(''); }} disabled={saving}>Decline</Button>
        <Button onClick={approve} loading={saving}>Approve return</Button>
      </>
    );
  } else if (mode === 'receive') {
    footer = (<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={receive} loading={saving}>Mark as received</Button></>);
  } else if (mode === 'refund') {
    footer = (<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={refund} loading={saving}>{isPaid ? 'Refund' : 'Mark as refunded'}</Button></>);
  } else {
    footer = (<><Button variant="outline" onClick={onClose} disabled={saving}>Back</Button><Button variant="danger" onClick={close} loading={saving}>Close return</Button></>);
  }

  return (
    <Modal title={`${TITLES[mode]} - ${orderNumber}`} onClose={onClose} footer={footer} width={480}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          {lines.map(l => (
            <div key={l.itemId}>
              <p className="text-[13px] font-semibold text-charcoal">{l.name} x {l.quantity}</p>
              {l.reason && mode === 'review' && <p className="text-[12px] text-slate">Customer reason: {l.reason}</p>}
            </div>
          ))}
          {customerName && <p className="text-[12px] text-slate">Customer: {customerName}</p>}
        </div>

        {mode === 'review' && !declining && (
          <p className="text-[12.5px] text-slate leading-[1.5]">
            Approving lets the customer send the item back (you can buy a prepaid return label from the order page). No refund is issued and stock does not change until you mark the return as received.
          </p>
        )}
        {mode === 'review' && declining && (
          <Textarea label="Reason shown to the customer" rows={3} placeholder="Explain why this return is declined" value={reason} onChange={e => setReason(e.target.value)} />
        )}

        {mode === 'receive' && (
          <div role="radiogroup" aria-label="Returned stock" className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em]">Returned items go to</p>
            <Choice value="restock" current={restock} onPick={setRestock} label="Restock" hint="Back into sellable inventory" disabled={saving} />
            <Choice value="damaged" current={restock} onPick={setRestock} label="Damaged stock" hint="On hand but not sellable" disabled={saving} />
            <Choice value="none" current={restock} onPick={setRestock} label="Do not restock" hint="Leave inventory unchanged" disabled={saving} />
          </div>
        )}

        {mode === 'refund' && (
          isPaid ? (
            <div role="radiogroup" aria-label="Refund to" className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em]">Refund to</p>
              <Choice value="original" current={refundTo} onPick={setRefundTo} label="Original payment method" hint="Item price and its tax, up to what is left to refund on the order" disabled={saving} />
              <Choice value="store_credit" current={refundTo} onPick={setRefundTo} label="Store credit" hint="The customer gets spendable credit in your store" disabled={saving} />
            </div>
          ) : (
            <p className="text-[12.5px] text-slate">This order has not been paid, so there is no money to refund. The return will be marked as refunded.</p>
          )
        )}

        {mode === 'close' && (
          <>
            <p className="text-[12.5px] text-slate leading-[1.5]">Closing ends this return without a refund or exchange. Stock that was already restocked is not changed.</p>
            <Textarea label="Note for the customer (optional)" rows={2} value={reason} onChange={e => setReason(e.target.value)} />
          </>
        )}

        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
