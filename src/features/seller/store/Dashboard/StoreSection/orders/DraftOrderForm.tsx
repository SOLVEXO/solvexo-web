import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol } from '@/utils/currency';
import { apiListVariants, apiGetStoreInventory, type ProductVariant } from '@/api/services/product';
import {
  apiSearchDraftOrderCustomers, apiCreateDraftOrder, apiGetDraftOrder, apiUpdateDraftOrder,
  apiCancelDraftOrder, apiCompleteDraftOrder,
  type DraftOrder, type DraftOrderItem, type DraftOrderCustomer,
} from '@/api/services/draftOrders';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white';

function CustomerPicker({ customerId, customerName, customerEmail, customerPhone, storeId, onChange }: {
  customerId: string | null; customerName: string; customerEmail: string; customerPhone: string;
  storeId: string;
  onChange: (v: { customerId: string | null; customerName: string; customerEmail: string; customerPhone: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DraftOrderCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(!customerId && !!customerName);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      apiSearchDraftOrderCustomers(storeId, query.trim()).then(res => setResults(res.data)).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, storeId]);

  if (customerId) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-bone bg-cream">
        <div className="flex items-center gap-2 min-w-0">
          <User size={15} className="text-slate shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-charcoal truncate">{customerName}</p>
            <p className="text-[11px] text-slate truncate">{customerEmail}</p>
          </div>
        </div>
        <button type="button" onClick={() => onChange({ customerId: null, customerName: '', customerEmail: '', customerPhone: '' })}
          className="text-[11px] font-semibold text-error bg-transparent border-none cursor-pointer shrink-0">Change</button>
      </div>
    );
  }

  if (guestMode) {
    return (
      <div className="flex flex-col gap-2">
        <input className={inp} placeholder="Customer name" value={customerName} onChange={e => onChange({ customerId: null, customerName: e.target.value, customerEmail, customerPhone })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inp} placeholder="Email (optional)" value={customerEmail} onChange={e => onChange({ customerId: null, customerName, customerEmail: e.target.value, customerPhone })} />
          <input className={inp} placeholder="Phone (optional)" value={customerPhone} onChange={e => onChange({ customerId: null, customerName, customerEmail, customerPhone: e.target.value })} />
        </div>
        <div className="flex items-start gap-1.5 text-[11px] text-slate bg-cream rounded-lg px-2.5 py-2">
          <AlertTriangle size={12} className="mt-[1px] shrink-0" />
          A guest draft can be priced and saved, but needs a registered customer account attached before it can be completed into a real order.
        </div>
        <button type="button" onClick={() => setGuestMode(false)} className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">
          Search for a registered customer instead
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input className={`${inp} pl-9`} placeholder="Search customers by name or email…" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-bone rounded-lg shadow-lg max-h-[220px] overflow-y-auto">
          {results.map(c => (
            <button key={c.id} type="button" onClick={() => { onChange({ customerId: c.id, customerName: c.name, customerEmail: c.email, customerPhone: c.phone }); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-cream border-none bg-transparent cursor-pointer block">
              <span className="font-semibold text-charcoal">{c.name}</span> <span className="text-slate">· {c.email}</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setGuestMode(true)} className="text-[11px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left mt-1.5">
        Or enter guest details manually
      </button>
    </div>
  );
}

export default function DraftOrderForm() {
  const { storeId, store } = useStoreWorkspace();
  const { draftId } = useParams<{ draftId: string }>();
  const isNew = !draftId || draftId === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [draft, setDraft] = useState<DraftOrder | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<DraftOrderItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | ''>('');
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const currency = draft?.currency ?? store?.baseCurrency ?? 'USD';
  const symbol = currencySymbol(currency);
  const isEditable = isNew || draft?.status === 'open';
  const loadedOnce = useRef(false);

  const loadDraft = useCallback(() => {
    if (isNew || !draftId) return;
    setLoading(true);
    apiGetDraftOrder(storeId, draftId).then(res => {
      const d = res.data;
      setDraft(d);
      setCustomerId(d.customerId);
      setCustomerName(d.customerName);
      setCustomerEmail(d.customerEmail ?? '');
      setCustomerPhone(d.customerPhone ?? '');
      setItems(d.items);
      setDiscountType(d.discountType ?? '');
      setDiscountValue(d.discountValue);
      setShippingAmount(d.shippingAmount);
      setTaxAmount(d.taxAmount);
      setNotes(d.notes);
    }).finally(() => setLoading(false));
  }, [storeId, draftId, isNew]);

  useEffect(() => { if (!loadedOnce.current) { loadedOnce.current = true; loadDraft(); } }, [loadDraft]);

  const addProduct = async (productIds: string[]) => {
    setPickerOpen(false);
    const productId = productIds[0];
    if (!productId) return;
    try {
      const [variantsRes, inventoryRes] = await Promise.all([
        apiListVariants(productId),
        apiGetStoreInventory(storeId, 1, 200),
      ]);
      const variants: ProductVariant[] = variantsRes.data;
      const variant = variants.find(v => v.isDefault) ?? variants[0];
      if (!variant) { toast.error('This product has no purchasable variant.'); return; }
      const productRow = inventoryRes.data.products.find(p => p.productId === productId);
      setItems(prev => [...prev, {
        productId, variantId: variant._id, type: productRow?.type ?? 'physical', name: productRow?.name ?? 'Product',
        image: variant.images?.[0] ?? productRow?.image ?? null, sku: variant.sku, options: variant.options.map(o => ({ name: o.name, value: o.value })),
        quantity: 1, unitPrice: variant.price,
      }]);
    } catch {
      toast.error('Failed to load product details.');
    }
  };

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmount = discountType === 'percentage' ? subtotal * (discountValue / 100) : discountType === 'fixed' ? Math.min(discountValue, subtotal) : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);

  const buildPayload = () => ({
    customerId: customerId ?? undefined,
    customerName,
    customerEmail: customerEmail || undefined,
    customerPhone: customerPhone || undefined,
    items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice })),
    discountType: discountType || undefined,
    discountValue,
    shippingAmount,
    taxAmount,
    notes,
  });

  const handleSave = async () => {
    if (!customerName.trim()) { toast.error('Enter a customer name.'); return; }
    if (items.length === 0) { toast.error('Add at least one item.'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const res = await apiCreateDraftOrder(storeId, buildPayload());
        toast.success('Draft order created.');
        navigate(`/store/${storeId}/draft-orders/${res.data._id}`, { replace: true });
      } else if (draftId) {
        await apiUpdateDraftOrder(storeId, draftId, buildPayload());
        toast.success('Draft order saved.');
        loadDraft();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft order.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!draftId) return;
    await apiCancelDraftOrder(storeId, draftId);
    toast.success('Draft order cancelled.');
    setConfirmingCancel(false);
    loadDraft();
  };

  const handleComplete = async () => {
    if (!draftId) return;
    setCompleting(true);
    try {
      const res = await apiCompleteDraftOrder(storeId, draftId);
      toast.success(`Order ${res.data.orderNumber} created.`);
      navigate(`/store/${storeId}/orders/detail/${res.data.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete draft order.');
    } finally {
      setCompleting(false);
      setConfirmingComplete(false);
    }
  };

  if (loading) return <div className="px-4 lg:px-7 py-8 text-[13px] text-slate">Loading…</div>;

  return (
    <>
      <StorePageHeader
        title={isNew ? 'New Draft Order' : `Draft Order${draft?.orderNumber ? ` · ${draft.orderNumber}` : ''}`}
        subtitle={!isNew && draft ? `Status: ${draft.status}` : 'Build a manually-priced order for a phone, in-person, or wholesale sale.'}
        actions={
          <div className="flex gap-2">
            {!isNew && draft?.status === 'open' && (
              <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>Cancel Draft</Button>
            )}
            {isEditable && <Button size="sm" loading={saving} onClick={handleSave}>{isNew ? 'Create' : 'Save'}</Button>}
            {!isNew && draft?.status === 'open' && (
              <Button size="sm" variant="primary" icon={<CheckCircle2 size={13} />} onClick={() => setConfirmingComplete(true)}>Complete Order</Button>
            )}
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-bone p-4">
            <p className="text-[13px] font-bold text-charcoal mb-3">Customer</p>
            <CustomerPicker
              customerId={customerId} customerName={customerName} customerEmail={customerEmail} customerPhone={customerPhone}
              storeId={storeId}
              onChange={v => { setCustomerId(v.customerId); setCustomerName(v.customerName); setCustomerEmail(v.customerEmail); setCustomerPhone(v.customerPhone); }}
            />
          </div>

          <div className="bg-white rounded-xl border border-bone p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-charcoal">Items</p>
              {isEditable && <Button size="xs" variant="outline" icon={<Plus size={12} />} onClick={() => setPickerOpen(true)}>Add product</Button>}
            </div>
            {items.length === 0 ? (
              <p className="text-[12.5px] text-slate py-4 text-center">No items yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-bone">
                    <div className="w-10 h-10 rounded-lg bg-cream border border-bone shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.name}</p>
                      {item.options.length > 0 && <p className="text-[11px] text-slate truncate">{item.options.map(o => o.value).join(' / ')}</p>}
                    </div>
                    {isEditable ? (
                      <>
                        <input type="number" min={1} value={item.quantity} className="w-14 px-2 py-1.5 text-[12px] border border-bone rounded-md text-center"
                          onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quantity: Math.max(1, Number(e.target.value)) } : it))} />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate">{symbol}</span>
                          <input type="number" min={0} value={item.unitPrice} className="w-20 pl-5 pr-2 py-1.5 text-[12px] border border-bone rounded-md"
                            onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, unitPrice: Math.max(0, Number(e.target.value)) } : it))} />
                        </div>
                        <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-error bg-transparent border-none cursor-pointer p-1">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <p className="text-[12px] font-semibold text-charcoal shrink-0">{item.quantity} × {symbol}{item.unitPrice.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-bone p-4">
            <p className="text-[13px] font-bold text-charcoal mb-3">Notes</p>
            <textarea className={`${inp} resize-y min-h-[70px]`} placeholder="Internal note (not shown to the customer)" value={notes} onChange={e => setNotes(e.target.value)} disabled={!isEditable} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-bone p-4 h-fit flex flex-col gap-3">
          <p className="text-[13px] font-bold text-charcoal">Summary</p>
          <div className="flex justify-between text-[12.5px]"><span className="text-slate">Subtotal</span><span className="text-charcoal font-medium">{symbol}{subtotal.toFixed(2)}</span></div>

          <div className="flex items-center gap-2">
            <select className={inp} value={discountType} onChange={e => setDiscountType(e.target.value as '' | 'percentage' | 'fixed')} disabled={!isEditable}>
              <option value="">No discount</option>
              <option value="percentage">% discount</option>
              <option value="fixed">Fixed discount</option>
            </select>
            {discountType && (
              <input type="number" min={0} className="w-20 px-2 py-2 text-[13px] border border-bone rounded-lg" value={discountValue}
                onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))} disabled={!isEditable} />
            )}
          </div>
          {discountAmount > 0 && <div className="flex justify-between text-[12.5px]"><span className="text-slate">Discount</span><span className="text-[#16a34a]">-{symbol}{discountAmount.toFixed(2)}</span></div>}

          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] text-slate">Shipping</label>
            <input type="number" min={0} className="w-24 px-2 py-1.5 text-[12.5px] border border-bone rounded-lg text-right" value={shippingAmount}
              onChange={e => setShippingAmount(Math.max(0, Number(e.target.value)))} disabled={!isEditable} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] text-slate">Tax</label>
            <input type="number" min={0} className="w-24 px-2 py-1.5 text-[12.5px] border border-bone rounded-lg text-right" value={taxAmount}
              onChange={e => setTaxAmount(Math.max(0, Number(e.target.value)))} disabled={!isEditable} />
          </div>

          <div className="h-px bg-bone" />
          <div className="flex justify-between text-[16px] font-bold text-charcoal"><span>Total</span><span>{symbol}{total.toFixed(2)}</span></div>
        </div>
      </div>

      {pickerOpen && (
        <EntityPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} mode="products" storeId={storeId} multiple={false} initialSelectedIds={[]} onConfirm={addProduct} title="Add a product" currencySymbol={symbol} />
      )}

      {confirmingCancel && (
        <ConfirmDialog title="Cancel this draft order?" message="This cannot be undone." confirmLabel="Cancel Draft" onConfirm={handleCancel} onCancel={() => setConfirmingCancel(false)} />
      )}
      {confirmingComplete && (
        <ConfirmDialog
          title="Complete this order?"
          message={`This will create a real order for ${symbol}${total.toFixed(2)} and reduce stock for each item. This cannot be undone.`}
          confirmLabel="Complete Order"
          loading={completing}
          onConfirm={handleComplete}
          onCancel={() => setConfirmingComplete(false)}
        />
      )}
    </>
  );
}
