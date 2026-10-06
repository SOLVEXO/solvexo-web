import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button, Field, Modal, Select } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import {
  apiCreateExchange, type CreateExchangePayload, type ExchangeResult,
} from '@/api/services/orders';
import type { ProductVariant, SellerOrderDetailItem } from '@/api/services/product';
import { AddProductSearch } from './EditOrderModal';

interface Replacement { variantId: string; label: string; price: number; quantity: number }

interface Props {
  storeId: string;
  orderId: string;
  orderNumber: string;
  /** Physical lines with a pending return request and no exchange yet. */
  lines: SellerOrderDetailItem[];
  symbol: string;
  isPaid: boolean;
  onClose: () => void;
  /** Called after the exchange was created; the parent refetches. */
  onDone: (exchangeOrderId: string | undefined) => void;
}

const money = (symbol: string, n: number) => `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** Shopify "Create exchange": pick the returned lines, pick replacement variants, review the price difference, confirm. */
export function ExchangeModal({ storeId, orderId, orderNumber, lines, symbol, isPaid, onClose, onDone }: Props) {
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>(() => (lines.length === 1 ? [lines[0]._id] : []));
  const [repl, setRepl] = useState<Replacement[]>([]);
  const [refundTo, setRefundTo] = useState<'original' | 'store_credit'>('original');
  const [restock, setRestock] = useState<'none' | 'restock' | 'damaged'>('none');
  const [preview, setPreview] = useState<ExchangeResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const reqId = useRef(0);

  const body = useMemo<CreateExchangePayload>(() => ({
    returnItemIds: picked,
    replacements: repl.map(r => ({ variantId: r.variantId, quantity: r.quantity })),
    refundTo,
    restock,
  }), [picked, repl, refundTo, restock]);

  const ready = picked.length > 0 && repl.length > 0;

  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(() => {
      setSaveError('');
      if (!ready) { setPreview(null); setPreviewError(''); setPreviewing(false); return; }
      setPreviewing(true);
      apiCreateExchange(storeId, orderId, { ...body, dryRun: true })
        .then(res => { if (id === reqId.current) { setPreview(res.data); setPreviewError(''); } })
        .catch((err: unknown) => {
          if (id !== reqId.current) return;
          setPreview(null);
          setPreviewError(err instanceof Error ? err.message : 'Could not calculate this exchange.');
        })
        .finally(() => { if (id === reqId.current) setPreviewing(false); });
    }, ready ? 400 : 0);
    return () => clearTimeout(t);
  }, [body, ready, storeId, orderId]);

  const addVariant = (v: ProductVariant, productName: string) => {
    const label = `${productName}${v.options.length ? ' - ' + v.options.map(o => o.value).join(' / ') : ''}`;
    setRepl(list => list.some(r => r.variantId === v._id)
      ? list.map(r => r.variantId === v._id ? { ...r, quantity: Math.min(999, r.quantity + 1) } : r)
      : [...list, { variantId: v._id, label, price: v.price, quantity: 1 }]);
  };
  const setQty = (variantId: string, n: number) =>
    setRepl(list => n <= 0 ? list.filter(r => r.variantId !== variantId) : list.map(r => r.variantId === variantId ? { ...r, quantity: Math.min(999, n) } : r));

  const canSubmit = ready && !!preview && !previewing && !previewError && !saving && isPaid;

  const save = () => {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError('');
    apiCreateExchange(storeId, orderId, body)
      .then(res => {
        toast.success(`Exchange order ${res.data.exchangeOrderNumber ?? ''} created`.trim());
        if (res.data.refundNote) toast.info(res.data.refundNote);
        onDone(res.data.exchangeOrderId);
      })
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : 'Failed to create the exchange.'))
      .finally(() => setSaving(false));
  };

  const fmt = (n: number) => money(symbol, n);

  return (
    <Modal
      title={`Create exchange for order ${orderNumber}`}
      width={640}
      onClose={() => { if (!saving) onClose(); }}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!canSubmit}>Create exchange</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {!isPaid && (
          <p role="alert" className="text-[12px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
            This order is not paid yet. Record the payment first — the returned items are credited against the replacement.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold text-charcoal uppercase tracking-[0.05em]">Returned items</p>
          {lines.length === 0 && <p className="text-[12.5px] text-slate">No returns are waiting for a decision on this order.</p>}
          {lines.map(i => (
            <label key={i._id} className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={picked.includes(i._id)}
                onChange={e => setPicked(p => e.target.checked ? [...p, i._id] : p.filter(x => x !== i._id))}
                disabled={saving}
              />
              <span className="truncate flex-1">{i.name} × {i.quantity}</span>
              <span className="text-slate shrink-0">{fmt(i.totalPrice)}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-charcoal uppercase tracking-[0.05em]">Replacement items</p>
          {repl.length === 0 && <p className="text-[12.5px] text-slate">Search for the product(s) the customer gets instead.</p>}
          {repl.map(r => (
            <div key={r.variantId} className="flex items-center gap-3 border border-bone rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-charcoal truncate">{r.label}</p>
                <p className="text-[11px] text-slate">{fmt(r.price)} each (current price)</p>
              </div>
              <input
                aria-label={`Quantity of ${r.label}`} inputMode="numeric" value={r.quantity} disabled={saving}
                onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); setQty(r.variantId, Number.isNaN(n) ? 0 : n); }}
                className="w-12 h-7 text-center text-[12.5px] border border-bone rounded-md outline-none"
              />
              <button type="button" aria-label={`Remove ${r.label}`} onClick={() => setQty(r.variantId, 0)} className="text-slate hover:text-error cursor-pointer"><X size={14} /></button>
            </div>
          ))}
          <AddProductSearch storeId={storeId} symbol={symbol} onAdd={addVariant} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Returned items go">
            <Select value={restock} onChange={e => setRestock(e.target.value as 'none' | 'restock' | 'damaged')} disabled={saving}>
              <option value="none">Leave stock unchanged</option>
              <option value="restock">Back to sellable stock</option>
              <option value="damaged">To damaged stock</option>
            </Select>
          </Field>
          <Field label="If the customer is owed money, refund to">
            <Select value={refundTo} onChange={e => setRefundTo(e.target.value as 'original' | 'store_credit')} disabled={saving}>
              <option value="original">Original payment method</option>
              <option value="store_credit">Store credit</option>
            </Select>
          </Field>
        </div>

        <div className="border border-bone rounded-lg px-4 py-3 flex flex-col gap-1.5" aria-live="polite">
          <p className="text-[11px] font-bold text-charcoal uppercase tracking-[0.05em]">Summary</p>
          {!ready && <p className="text-[12.5px] text-slate">Pick the returned item(s) and at least one replacement to see the price difference.</p>}
          {ready && previewing && <p className="text-[12.5px] text-slate">Calculating...</p>}
          {ready && !previewing && preview && (
            <>
              <div className="flex items-center justify-between text-[12.5px]"><span className="text-slate">Returned items credit</span><span className="text-charcoal">{fmt(preview.credit)}</span></div>
              <div className="flex items-center justify-between text-[12.5px]"><span className="text-slate">Replacement items (incl. tax)</span><span className="text-charcoal">{fmt(preview.replacementValue)}</span></div>
              {preview.creditShortfall > 0 && (
                <p className="text-[11.5px] text-warning">{fmt(preview.creditShortfall)} of the returned value was already refunded, so only {fmt(preview.credit)} is credited.</p>
              )}
              <div className="flex items-center justify-between text-[13px] pt-1 border-t border-bone">
                <span className="font-semibold text-charcoal">
                  {preview.outcome === 'charge' ? 'Customer owes' : preview.outcome === 'refund' ? 'Refund to customer' : 'Difference'}
                </span>
                <span className="font-bold text-charcoal">{preview.outcome === 'even' ? 'Even exchange' : fmt(preview.outcome === 'charge' ? preview.amountDue : preview.refundDue)}</span>
              </div>
              {preview.outcome === 'charge' && (
                <p className="text-[11.5px] text-slate">The exchange order is created unpaid (cash on delivery). You collect the difference yourself, then record the payment on the new order.</p>
              )}
              {preview.outcome === 'refund' && (
                <p className="text-[11.5px] text-slate">The difference is refunded now to the {refundTo === 'store_credit' ? 'customer\'s store credit' : 'original payment method'}.</p>
              )}
            </>
          )}
          {previewError && (
            <div role="alert" className="bg-error-bg border border-error-border rounded-lg px-3 py-2 flex items-start gap-2 text-[12.5px] text-error">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{previewError}</span>
            </div>
          )}
          {saveError && (
            <div role="alert" className="bg-error-bg border border-error-border rounded-lg px-3 py-2 flex items-start gap-2 text-[12.5px] text-error">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{saveError}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
