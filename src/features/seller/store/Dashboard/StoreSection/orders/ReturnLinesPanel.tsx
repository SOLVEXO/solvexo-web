import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import type { SellerOrderDetailItem } from '@/api/services/product';
import { ReturnWorkflowModal } from '../returns/ReturnWorkflowModal';
import {
  PRIMARY_RETURN_LABEL, RETURN_STATUS_STYLE, primaryReturnMode, returnStatusLabel, type ReturnWorkflowMode,
} from '../returns/returnStatus';

const STEPS = ['Requested', 'Approved', 'Received', 'Resolved'];

/** How far along the Shopify return path a status is (index into STEPS; -1 = ended early). */
function stepIndex(status: string): number {
  switch (status) {
    case 'requested': return 0;
    case 'approved': return 1;
    case 'received': return 2;
    case 'refunded':
    case 'exchanged':
    case 'closed': return 3;
    default: return -1;
  }
}

interface Props {
  storeId: string;
  orderId: string;
  orderNumber: string;
  isPaid: boolean;
  /** Lines of this store's sub-order that have a return (returnStatus !== 'none'). */
  lines: SellerOrderDetailItem[];
  /** orders.return permission. */
  canAct: boolean;
  /** Parent has an action in flight. */
  busy: boolean;
  onChanged: () => void;
  /** Open the exchange dialog for these lines. */
  onExchange: (itemIds: string[]) => void;
  /** Exchanges are created from the original order only. */
  canExchange: boolean;
}

/** Seller view of every return line on an order: status path + the next step (Shopify: approve -> receive -> refund / exchange). */
export function ReturnLinesPanel({ storeId, orderId, orderNumber, isPaid, lines, canAct, busy, onChanged, onExchange, canExchange }: Props) {
  const [workflow, setWorkflow] = useState<{ mode: ReturnWorkflowMode; ids: string[] } | null>(null);
  if (lines.length === 0) return null;

  const modalLines = workflow
    ? lines.filter(l => workflow.ids.includes(l._id)).map(l => ({ itemId: l._id, name: l.name, quantity: l.quantity, reason: l.returnReason }))
    : [];

  return (
    <div className="flex flex-col gap-3 mb-3">
      {lines.map(i => {
        const st = RETURN_STATUS_STYLE[i.returnStatus] ?? { bg: '#F0EEE6', color: '#5A5852', label: i.returnStatus };
        const step = stepIndex(i.returnStatus);
        const mode = primaryReturnMode(i.returnStatus);
        const open = mode !== null;
        const canExchangeLine = open && i.type === 'physical' && !i.exchangeOrderId && canExchange;
        const canClose = i.returnStatus === 'approved' || i.returnStatus === 'received';
        return (
          <div key={i._id} className="border border-bone rounded-lg px-3.5 py-3">
            <div className="flex items-start gap-2 flex-wrap">
              <p className="text-[12.5px] font-semibold text-charcoal flex-1 min-w-0 truncate">{i.name} x {i.quantity}</p>
              <span className="inline-block px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap" style={{ background: st.bg, color: st.color }}>
                {returnStatusLabel(i.returnStatus)}
              </span>
            </div>
            {i.returnReason && <p className="text-[12px] text-slate mt-1">Reason: {i.returnReason}</p>}
            {i.returnStatus === 'rejected' && i.returnRejectReason && <p className="text-[12px] text-slate mt-1">Declined: {i.returnRejectReason}</p>}
            {step >= 0 && (
              <ol className="flex items-center gap-1.5 mt-2 flex-wrap" aria-label="Return progress">
                {STEPS.map((s, k) => (
                  <li key={s} className={`text-[11px] px-2 py-0.5 rounded-full ${k <= step ? 'bg-brand-pale-orange text-brand-deep-orange font-semibold' : 'bg-cream text-slate'}`}>
                    {k === 3 && step === 3 ? returnStatusLabel(i.returnStatus) : s}
                  </li>
                ))}
              </ol>
            )}
            {i.returnStatus === 'received' && i.returnRestock && (
              <p className="text-[11.5px] text-slate mt-1.5">Stock: {i.returnRestock === 'restock' ? 'restocked' : i.returnRestock === 'damaged' ? 'moved to damaged stock' : 'not restocked'}</p>
            )}
            {i.returnStatus === 'refunded' && i.returnRefundTo && (
              <p className="text-[11.5px] text-slate mt-1.5">Refunded to {i.returnRefundTo === 'store_credit' ? 'store credit' : 'the original payment method'}</p>
            )}
            {canAct && open && (
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Button size="xs" disabled={busy} onClick={() => setWorkflow({ mode, ids: [i._id] })}>{PRIMARY_RETURN_LABEL[mode]}</Button>
                {canExchangeLine && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => onExchange([i._id])}>
                    <RefreshCw size={12} /> Exchange
                  </Button>
                )}
                {canClose && (
                  <Button size="xs" variant="outline" disabled={busy} onClick={() => setWorkflow({ mode: 'close', ids: [i._id] })}>Close return</Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {workflow && (
        <ReturnWorkflowModal
          mode={workflow.mode}
          storeId={storeId}
          orderId={orderId}
          orderNumber={orderNumber}
          lines={modalLines}
          isPaid={isPaid}
          onClose={() => setWorkflow(null)}
          onDone={onChanged}
        />
      )}
    </div>
  );
}
