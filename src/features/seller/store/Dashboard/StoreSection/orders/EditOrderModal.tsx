import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Minus, Package, Plus, Search, X } from 'lucide-react';
import { Button, Field, Input, Modal, Select } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiEditOrder, type EditOrderPayload, type EditOrderResult } from '@/api/services/orders';
import {
  apiGetStoreInventory, apiListVariants,
  type InventoryProduct, type ProductVariant, type SellerOrderDetailItem,
} from '@/api/services/product';

const MAX_QTY = 999;

interface Addition { variantId: string; label: string; price: number; quantity: number }

interface Props {
  storeId: string;
  orderId: string;
  orderNumber: string;
  items: SellerOrderDetailItem[];
  symbol: string;
  isPaid: boolean;
  onClose: () => void;
  /** Called after a successful (non-dry-run) save; the parent refetches. */
  onSaved: () => void;
}

const isEditable = (i: SellerOrderDetailItem) =>
  (i.status === 'pending' || i.status === 'processing') && !i.cancelledAt && i.returnStatus === 'none';

const money = (symbol: string, n: number) => `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function QtyStepper({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center border border-bone rounded-md overflow-hidden">
      <button type="button" aria-label="Decrease quantity" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}
        className="w-7 h-7 flex items-center justify-center hover:bg-cream disabled:opacity-40 cursor-pointer"><Minus size={12} /></button>
      <input
        aria-label="Quantity" inputMode="numeric" value={value} disabled={disabled}
        onChange={e => { const n = parseInt(e.target.value.replace(/\D/g, ''), 10); onChange(Number.isNaN(n) ? 0 : Math.min(n, MAX_QTY)); }}
        className="w-10 h-7 text-center text-[12.5px] outline-none border-x border-bone"
      />
      <button type="button" aria-label="Increase quantity" disabled={disabled || value >= MAX_QTY} onClick={() => onChange(value + 1)}
        className="w-7 h-7 flex items-center justify-center hover:bg-cream disabled:opacity-40 cursor-pointer"><Plus size={12} /></button>
    </div>
  );
}

export function AddProductSearch({ storeId, symbol, onAdd }: {
  storeId: string; symbol: string; onAdd: (v: ProductVariant, productName: string) => void;
}) {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [openProduct, setOpenProduct] = useState<InventoryProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    if (!q.trim()) { setProducts([]); setSearchError(''); setSearching(false); return; }
    const id = ++reqId.current;
    setSearching(true);
    const t = setTimeout(() => {
      apiGetStoreInventory(storeId, 1, 10, { q, status: 'active', type: 'physical' })
        .then(res => { if (id === reqId.current) { setProducts(res.data.products); setSearchError(''); } })
        .catch((err: unknown) => { if (id === reqId.current) setSearchError(err instanceof Error ? err.message : 'Search failed.'); })
        .finally(() => { if (id === reqId.current) setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [q, storeId]);

  const pick = (p: InventoryProduct) => {
    setOpenProduct(p);
    setVariants([]);
    setVariantsError('');
    setVariantsLoading(true);
    apiListVariants(p.productId)
      .then(res => setVariants(res.data.filter(v => !v.isDelete && v.status !== 'inactive')))
      .catch((err: unknown) => setVariantsError(err instanceof Error ? err.message : 'Failed to load variants.'))
      .finally(() => setVariantsLoading(false));
  };

  return (
    <div className="border border-bone rounded-lg p-3 flex flex-col gap-2">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <Input
          aria-label="Search products to add" placeholder="Search products to add"
          value={q} onChange={e => { setQ(e.target.value); setOpenProduct(null); }}
          className="pl-8"
        />
      </div>
      {searching && <p className="text-[12px] text-slate">Searching...</p>}
      {searchError && <p role="alert" className="text-[12px] text-error">{searchError}</p>}
      {!openProduct && !searching && !searchError && q.trim() && products.length === 0 && (
        <p className="text-[12px] text-slate">No matching active physical products.</p>
      )}
      {!openProduct && products.length > 0 && (
        <ul className="flex flex-col max-h-48 overflow-y-auto">
          {products.map(p => (
            <li key={p.productId}>
              <button type="button" onClick={() => pick(p)} className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-cream rounded-md text-left cursor-pointer">
                <span className="w-8 h-8 rounded bg-cream border border-bone flex items-center justify-center overflow-hidden shrink-0">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-slate" />}
                </span>
                <span className="text-[12.5px] text-charcoal truncate flex-1">{p.name}</span>
                <span className="text-[11px] text-slate shrink-0">{money(symbol, p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {openProduct && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-charcoal truncate">{openProduct.name}</p>
            <button type="button" onClick={() => setOpenProduct(null)} className="text-[11.5px] text-brand-orange cursor-pointer">Back to results</button>
          </div>
          {variantsLoading && <p className="text-[12px] text-slate">Loading variants...</p>}
          {variantsError && (
            <p role="alert" className="text-[12px] text-error">
              {variantsError} <button type="button" onClick={() => pick(openProduct)} className="underline cursor-pointer">Retry</button>
            </p>
          )}
          {!variantsLoading && !variantsError && variants.length === 0 && <p className="text-[12px] text-slate">No available variants.</p>}
          {variants.map(v => {
            const opts = v.options.map(o => o.value).join(' / ') || 'Default';
            return (
              <div key={v._id} className="flex items-center gap-2 py-1.5 border-t border-bone first:border-t-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-charcoal truncate">{opts}</p>
                  <p className="text-[11px] text-slate">
                    {money(symbol, v.price)} · {v.unlimitedStock ? 'Unlimited stock' : `${v.stock} in stock`}
                  </p>
                </div>
                <Button size="xs" variant="outline" disabled={!v.unlimitedStock && v.stock <= 0} onClick={() => onAdd(v, openProduct.name)}>
                  Add
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EditOrderModal({ storeId, orderId, orderNumber, items, symbol, isPaid, onClose, onSaved }: Props) {
  const toast = useToast();
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.filter(isEditable).map(i => [i._id, i.quantity])));
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [refundTo, setRefundTo] = useState<'original' | 'store_credit'>('original');
  const [preview, setPreview] = useState<EditOrderResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const reqId = useRef(0);

  const editable = items.filter(isEditable);
  const locked = items.filter(i => !isEditable(i));

  const body = useMemo<EditOrderPayload>(() => ({
    changes: editable.filter(i => qtys[i._id] !== i.quantity).map(i => ({ itemId: i._id, quantity: qtys[i._id] })),
    additions: additions.map(a => ({ variantId: a.variantId, quantity: a.quantity })),
    refundTo,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [qtys, additions, refundTo, items]);

  const hasChanges = (body.changes?.length ?? 0) > 0 || (body.additions?.length ?? 0) > 0;

  useEffect(() => {
    const id = ++reqId.current;
    setSaveError('');
    if (!hasChanges) { setPreview(null); setPreviewError(''); setPreviewing(false); return; }
    setPreviewing(true);
    const t = setTimeout(() => {
      apiEditOrder(storeId, orderId, { ...body, dryRun: true })
        .then(res => { if (id === reqId.current) { setPreview(res.data); setPreviewError(''); } })
        .catch((err: unknown) => {
          if (id !== reqId.current) return;
          setPreview(null);
          setPreviewError(err instanceof Error ? err.message : 'Could not preview this change.');
        })
        .finally(() => { if (id === reqId.current) setPreviewing(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [body, hasChanges, storeId, orderId]);

  const setQty = (id: string, n: number) => setQtys(q => ({ ...q, [id]: Math.max(0, Math.min(MAX_QTY, n)) }));

  const addVariant = (v: ProductVariant, productName: string) => {
    const label = `${productName}${v.options.length ? ' - ' + v.options.map(o => o.value).join(' / ') : ''}`;
    setAdditions(list => list.some(a => a.variantId === v._id)
      ? list.map(a => a.variantId === v._id ? { ...a, quantity: Math.min(MAX_QTY, a.quantity + 1) } : a)
      : [...list, { variantId: v._id, label, price: v.price, quantity: 1 }]);
  };

  const setAddQty = (variantId: string, n: number) =>
    setAdditions(list => n <= 0 ? list.filter(a => a.variantId !== variantId) : list.map(a => a.variantId === variantId ? { ...a, quantity: Math.min(MAX_QTY, n) } : a));

  const allRemoved = editable.length > 0 && editable.every(i => qtys[i._id] === 0) && additions.length === 0 && locked.length === 0;
  const canSubmit = hasChanges && !!preview && !previewing && !previewError && !saving && !allRemoved;

  const save = () => {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError('');
    apiEditOrder(storeId, orderId, body)
      .then(res => {
        toast.success('Order updated');
        if (res.data.refundNote) toast.info(res.data.refundNote);
        onSaved();
      })
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : 'Failed to update order.'))
      .finally(() => setSaving(false));
  };

  const sym = preview?.currency ? preview.currency : '';
  const fmt = (n: number) => money(symbol, n);

  return (
    <Modal
      title={`Edit order ${orderNumber}`}
      width={640}
      onClose={() => { if (!saving) onClose(); }}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!canSubmit}>Update order</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {isPaid && (
          <p className="text-[12px] text-slate bg-cream border border-bone rounded-lg px-3 py-2">
            This order is already paid, so it can only be reduced. To charge more, create a new order.
          </p>
        )}

        <div className="flex flex-col">
          {editable.length === 0 && <p className="text-[12.5px] text-slate">No unfulfilled items can be edited.</p>}
          {editable.map(i => {
            const q = qtys[i._id];
            const removed = q === 0;
            return (
              <div key={i._id} className="flex items-center gap-3 py-2.5 border-b border-bone last:border-b-0">
                <div className="w-10 h-10 rounded-lg bg-cream border border-bone shrink-0 flex items-center justify-center overflow-hidden">
                  {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-slate" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-semibold text-charcoal truncate ${removed ? 'line-through opacity-60' : ''}`}>{i.name}</p>
                  <p className="text-[11px] text-slate">
                    {i.options.map(o => `${o.name}: ${o.value}`).join(' · ')}{i.options.length ? ' · ' : ''}{fmt(i.price)} each
                  </p>
                  {removed && <p className="text-[11px] text-error font-semibold">Removed</p>}
                </div>
                <QtyStepper value={q} onChange={n => setQty(i._id, n)} disabled={saving} />
                <p className={`w-20 text-right text-[12.5px] font-bold text-charcoal ${removed ? 'line-through opacity-60' : ''}`}>{fmt(i.price * q)}</p>
              </div>
            );
          })}
          {locked.length > 0 && (
            <p className="text-[11.5px] text-slate pt-2">
              {locked.length} item{locked.length === 1 ? '' : 's'} already fulfilled, cancelled or in a return can't be changed.
            </p>
          )}
          {additions.map(a => (
            <div key={a.variantId} className="flex items-center gap-3 py-2.5 border-t border-bone">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-charcoal truncate">{a.label}</p>
                <p className="text-[11px] text-success">New item · {fmt(a.price)} each</p>
              </div>
              <QtyStepper value={a.quantity} onChange={n => setAddQty(a.variantId, n)} disabled={saving} />
              <p className="w-20 text-right text-[12.5px] font-bold text-charcoal">{fmt(a.price * a.quantity)}</p>
              <button type="button" aria-label={`Remove ${a.label}`} onClick={() => setAddQty(a.variantId, 0)} className="text-slate hover:text-error cursor-pointer"><X size={14} /></button>
            </div>
          ))}
        </div>

        <AddProductSearch storeId={storeId} symbol={symbol} onAdd={addVariant} />

        <div className="border border-bone rounded-lg px-4 py-3 flex flex-col gap-1.5" aria-live="polite">
          <p className="text-[11px] font-bold text-charcoal uppercase tracking-[0.05em]">Summary</p>
          {!hasChanges && <p className="text-[12.5px] text-slate">Change a quantity or add a product to see the new total.</p>}
          {hasChanges && previewing && <p className="text-[12.5px] text-slate">Calculating...</p>}
          {hasChanges && !previewing && preview && (
            <>
              {preview.lines.map((l, idx) => <p key={idx} className="text-[12px] text-slate">{l}</p>)}
              <div className="flex items-center justify-between text-[13px] pt-1">
                <span className="text-charcoal">Order total</span>
                <span className="font-bold text-charcoal">
                  <span className="line-through text-slate font-medium mr-2">{fmt(preview.oldTotal)}</span>{fmt(preview.newTotal)}
                </span>
              </div>
              {preview.refundAmount > 0 && (
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-[12.5px] text-charcoal">
                    Refund <strong>{fmt(preview.refundAmount)}</strong> to {refundTo === 'store_credit' ? 'store credit' : 'original payment method'}
                  </p>
                  {isPaid && (
                    <Field label="Refund to">
                      <Select value={refundTo} onChange={e => setRefundTo(e.target.value as 'original' | 'store_credit')} disabled={saving}>
                        <option value="original">Original payment method</option>
                        <option value="store_credit">Store credit</option>
                      </Select>
                    </Field>
                  )}
                </div>
              )}
              {!isPaid && preview.amountDue > 0 && (
                <p className="text-[12.5px] text-charcoal pt-1">Amount due on delivery: <strong>{fmt(preview.amountDue)}</strong></p>
              )}
              {sym && <p className="text-[11px] text-slate">Currency: {sym}</p>}
            </>
          )}
          {allRemoved && <p role="alert" className="text-[12px] text-error">You can't remove every item. Cancel the order instead.</p>}
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
