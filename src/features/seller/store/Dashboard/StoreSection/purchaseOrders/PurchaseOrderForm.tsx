import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, Search, CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import { EntityPickerModal } from '@/features/seller/store/Dashboard/OnlineStore/builder/EntityPickerModal';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol } from '@/utils/currency';
import { apiListVariants, apiGetStoreInventory, apiListActiveLocations, type ProductVariant, type StoreLocation } from '@/api/services/product';
import {
  apiCreatePurchaseOrder, apiGetPurchaseOrder, apiUpdatePurchaseOrder,
  apiMarkPurchaseOrderOrdered, apiCancelPurchaseOrder, apiCloseShortPurchaseOrder, apiReceivePurchaseOrder,
  apiListSuppliers, apiCreateSupplier,
  type PurchaseOrder, type PurchaseOrderItem, type Supplier,
} from '@/api/services/purchaseOrders';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white';

function SupplierPicker({ storeId, supplierId, supplierName, onChange }: {
  storeId: string; supplierId: string | null; supplierName: string;
  onChange: (v: { supplierId: string | null; supplierName: string }) => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { apiListSuppliers(storeId).then(res => setSuppliers(res.data)).catch(() => {}); }, [storeId]);

  const matches = suppliers.filter(s => s.status === 'active' && s.name.toLowerCase().includes(query.toLowerCase()));

  if (supplierId || (supplierName && !open)) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-bone bg-cream">
        <p className="text-[13px] font-semibold text-charcoal truncate">{supplierName}</p>
        <button type="button" onClick={() => { onChange({ supplierId: null, supplierName: '' }); setOpen(true); }}
          className="text-[11px] font-semibold text-error bg-transparent border-none cursor-pointer shrink-0">Change</button>
      </div>
    );
  }

  const handleCreateNew = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const res = await apiCreateSupplier(storeId, { name: query.trim() });
      setSuppliers(prev => [...prev, res.data]);
      onChange({ supplierId: res.data._id, supplierName: res.data.name });
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input className={`${inp} pl-9`} placeholder="Search or add a supplier…" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      </div>
      {open && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-bone rounded-lg shadow-lg max-h-[220px] overflow-y-auto">
          {matches.map(s => (
            <button key={s._id} type="button" onClick={() => { onChange({ supplierId: s._id, supplierName: s.name }); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-cream border-none bg-transparent cursor-pointer block">
              <span className="font-semibold text-charcoal">{s.name}</span>
            </button>
          ))}
          {query.trim() && !matches.some(s => s.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button type="button" onClick={handleCreateNew} disabled={creating}
              className="w-full text-left px-3 py-2 text-[12.5px] text-brand-orange font-semibold hover:bg-cream border-none bg-transparent cursor-pointer block border-t border-bone">
              + Add "{query.trim()}" as a new supplier
            </button>
          )}
          {matches.length === 0 && !query.trim() && <p className="px-3 py-2 text-[11px] text-slate">Type to search or add a supplier.</p>}
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrderForm() {
  const { storeId, store } = useStoreWorkspace();
  const { poId } = useParams<{ poId: string }>();
  const isNew = !poId || poId === 'new';
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Prefilled from ReorderSuggestions.tsx's "Create Purchase Order" action
  // (a supplier + starting item list via router state) — undefined/absent
  // for every other way of reaching this page (the plain "New Purchase
  // Order" button), which just starts blank as before.
  const prefill = isNew ? (location.state as {
    supplierId?: string | null; supplierName?: string;
    items?: { productId: string; variantId: string; name: string; image: string | null; sku: string; quantityOrdered: number }[];
  } | null) : null;

  const [loading, setLoading] = useState(!isNew);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(prefill?.supplierId ?? null);
  const [supplierName, setSupplierName] = useState(prefill?.supplierName ?? '');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [items, setItems] = useState<PurchaseOrderItem[]>(
    (prefill?.items ?? []).map(i => ({
      _id: `new-${i.variantId}`, productId: i.productId, variantId: i.variantId,
      name: i.name, image: i.image, sku: i.sku, options: [],
      quantityOrdered: i.quantityOrdered, quantityReceived: 0, quantityDamaged: 0,
      // Real unit cost isn't known from a reorder suggestion (that view has
      // no cost data) — 0 is a clear, honest "not yet set" starting point
      // the seller must fill in themselves before saving, never a guessed
      // number presented as if it were real.
      unitCost: 0,
    })),
  );
  const [shippingCost, setShippingCost] = useState(0);
  const [taxCost, setTaxCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [marking, setMarking] = useState(false);
  const [closingShort, setClosingShort] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const currency = po?.currency ?? store?.baseCurrency ?? 'USD';
  const symbol = currencySymbol(currency);
  const isEditable = isNew || po?.status === 'draft';
  const loadedOnce = useRef(false);

  useEffect(() => { apiListActiveLocations(storeId).then(res => setLocations(res.data ?? [])).catch(() => {}); }, [storeId]);

  const loadPo = useCallback(() => {
    if (isNew || !poId) return;
    setLoading(true);
    apiGetPurchaseOrder(storeId, poId).then(res => {
      const p = res.data;
      setPo(p);
      setSupplierId(p.supplierId);
      setSupplierName(p.supplierName);
      setLocationId(p.locationId ?? '');
      setItems(p.items);
      setShippingCost(p.shippingCost);
      setTaxCost(p.taxCost);
      setNotes(p.notes);
      setExpectedAt(p.expectedAt ? p.expectedAt.slice(0, 10) : '');
    }).finally(() => setLoading(false));
  }, [storeId, poId, isNew]);

  useEffect(() => { if (!loadedOnce.current) { loadedOnce.current = true; loadPo(); } }, [loadPo]);

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
        _id: `new-${Date.now()}`,
        productId, variantId: variant._id, name: productRow?.name ?? 'Product',
        image: variant.images?.[0] ?? productRow?.image ?? null, sku: variant.sku,
        options: variant.options.map(o => ({ name: o.name, value: o.value })),
        quantityOrdered: 1, quantityReceived: 0, quantityDamaged: 0,
        unitCost: variant.price,
      }]);
    } catch {
      toast.error('Failed to load product details.');
    }
  };

  const subtotal = items.reduce((s, i) => s + i.unitCost * i.quantityOrdered, 0);
  const total = Math.max(0, subtotal + shippingCost + taxCost);

  const buildPayload = () => ({
    supplierId: supplierId ?? undefined,
    supplierName,
    locationId: locationId || undefined,
    items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantityOrdered: i.quantityOrdered, unitCost: i.unitCost })),
    shippingCost, taxCost, notes,
    expectedAt: expectedAt || undefined,
  });

  const handleSave = async () => {
    if (!supplierName.trim()) { toast.error('Enter a supplier.'); return; }
    if (items.length === 0) { toast.error('Add at least one item.'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const res = await apiCreatePurchaseOrder(storeId, buildPayload());
        toast.success('Purchase order created.');
        navigate(`/store/${storeId}/purchase-orders/${res.data._id}`, { replace: true });
      } else if (poId) {
        await apiUpdatePurchaseOrder(storeId, poId, buildPayload());
        toast.success('Purchase order saved.');
        loadPo();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkOrdered = async () => {
    if (!poId) return;
    setMarking(true);
    try {
      await apiMarkPurchaseOrderOrdered(storeId, poId);
      toast.success('Marked as ordered.');
      loadPo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update purchase order.');
    } finally {
      setMarking(false);
    }
  };

  const handleCancel = async () => {
    if (!poId) return;
    await apiCancelPurchaseOrder(storeId, poId);
    toast.success('Purchase order cancelled.');
    setConfirmingCancel(false);
    loadPo();
  };

  const handleCloseShort = async () => {
    if (!poId) return;
    setClosingShort(true);
    try {
      await apiCloseShortPurchaseOrder(storeId, poId);
      toast.success('Purchase order closed.');
      loadPo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close purchase order.');
    } finally {
      setClosingShort(false);
    }
  };

  if (loading) return <div className="px-4 lg:px-7 py-8 text-[13px] text-slate">Loading…</div>;

  const canReceive = po && (po.status === 'ordered' || po.status === 'partially_received');

  return (
    <>
      <StorePageHeader
        title={isNew ? 'New Purchase Order' : po?.poNumber ?? 'Purchase Order'}
        subtitle={!isNew && po ? `Status: ${po.status.replace('_', ' ')}` : 'Order stock from a supplier and receive it once it arrives.'}
        actions={
          <div className="flex gap-2">
            {!isNew && po?.status === 'draft' && (
              <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>Cancel</Button>
            )}
            {isEditable && <Button size="sm" loading={saving} onClick={handleSave}>{isNew ? 'Create' : 'Save'}</Button>}
            {!isNew && po?.status === 'draft' && (
              <Button size="sm" variant="primary" icon={<CheckCircle2 size={13} />} loading={marking} onClick={handleMarkOrdered}>Mark as Ordered</Button>
            )}
            {!isNew && po?.status === 'ordered' && (
              <Button variant="outline" size="sm" icon={<XCircle size={13} />} onClick={() => setConfirmingCancel(true)}>Cancel</Button>
            )}
            {canReceive && (
              <Button size="sm" variant="primary" icon={<PackageCheck size={13} />} onClick={() => setReceiveOpen(true)}>Receive Shipment</Button>
            )}
            {!isNew && po?.status === 'partially_received' && (
              <Button variant="outline" size="sm" loading={closingShort} onClick={handleCloseShort}>Close as Short</Button>
            )}
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-bone p-4">
            <p className="text-[13px] font-bold text-charcoal mb-3">Supplier</p>
            {isEditable ? (
              <SupplierPicker storeId={storeId} supplierId={supplierId} supplierName={supplierName}
                onChange={v => { setSupplierId(v.supplierId); setSupplierName(v.supplierName); }} />
            ) : (
              <p className="text-[13px] text-charcoal">{supplierName}</p>
            )}

            {locations.length >= 2 && (
              <div className="mt-3">
                <label className="text-[12px] font-medium text-graphite mb-1 block">Destination location</label>
                <select className={inp} value={locationId} onChange={e => setLocationId(e.target.value)} disabled={!isEditable}>
                  <option value="">No specific location (adds to total stock)</option>
                  {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
            )}

            <div className="mt-3">
              <label className="text-[12px] font-medium text-graphite mb-1 block">Expected delivery date (optional)</label>
              <input type="date" className={inp} value={expectedAt} onChange={e => setExpectedAt(e.target.value)} disabled={!isEditable} />
            </div>
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
                  <div key={item._id} className="flex items-center gap-3 p-2.5 rounded-lg border border-bone">
                    <div className="w-10 h-10 rounded-lg bg-cream border border-bone shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.name}</p>
                      {item.options.length > 0 && <p className="text-[11px] text-slate truncate">{item.options.map(o => o.value).join(' / ')}</p>}
                      {!isNew && po?.status !== 'draft' && (
                        <p className="text-[10.5px] text-slate">
                          {item.quantityReceived} received{item.quantityDamaged > 0 ? ` · ${item.quantityDamaged} damaged` : ''} of {item.quantityOrdered}
                        </p>
                      )}
                    </div>
                    {isEditable ? (
                      <>
                        <input type="number" min={1} value={item.quantityOrdered} className="w-14 px-2 py-1.5 text-[12px] border border-bone rounded-md text-center"
                          onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quantityOrdered: Math.max(1, Number(e.target.value)) } : it))} />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate">{symbol}</span>
                          <input type="number" min={0} value={item.unitCost} className="w-20 pl-5 pr-2 py-1.5 text-[12px] border border-bone rounded-md"
                            onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, unitCost: Math.max(0, Number(e.target.value)) } : it))} />
                        </div>
                        <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-error bg-transparent border-none cursor-pointer p-1">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <p className="text-[12px] font-semibold text-charcoal shrink-0">{item.quantityOrdered} × {symbol}{item.unitCost.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-bone p-4">
            <p className="text-[13px] font-bold text-charcoal mb-3">Notes</p>
            <textarea className={`${inp} resize-y min-h-[70px]`} placeholder="Internal note" value={notes} onChange={e => setNotes(e.target.value)} disabled={!isEditable} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-bone p-4 h-fit flex flex-col gap-3">
          <p className="text-[13px] font-bold text-charcoal">Summary</p>
          <div className="flex justify-between text-[12.5px]"><span className="text-slate">Subtotal</span><span className="text-charcoal font-medium">{symbol}{subtotal.toFixed(2)}</span></div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] text-slate">Shipping</label>
            <input type="number" min={0} className="w-24 px-2 py-1.5 text-[12.5px] border border-bone rounded-lg text-right" value={shippingCost}
              onChange={e => setShippingCost(Math.max(0, Number(e.target.value)))} disabled={!isEditable} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] text-slate">Tax</label>
            <input type="number" min={0} className="w-24 px-2 py-1.5 text-[12.5px] border border-bone rounded-lg text-right" value={taxCost}
              onChange={e => setTaxCost(Math.max(0, Number(e.target.value)))} disabled={!isEditable} />
          </div>
          <div className="h-px bg-bone" />
          <div className="flex justify-between text-[16px] font-bold text-charcoal"><span>Total</span><span>{symbol}{total.toFixed(2)}</span></div>
        </div>
      </div>

      {pickerOpen && (
        <EntityPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} mode="products" storeId={storeId} multiple={false} initialSelectedIds={[]} onConfirm={addProduct} title="Add a product" currencySymbol={symbol} />
      )}

      {confirmingCancel && (
        <ConfirmDialog title="Cancel this purchase order?" message="This cannot be undone." confirmLabel="Cancel Purchase Order" onConfirm={handleCancel} onCancel={() => setConfirmingCancel(false)} />
      )}

      {receiveOpen && po && poId && (
        <ReceiveShipmentModal
          storeId={storeId}
          po={po}
          onClose={() => setReceiveOpen(false)}
          onReceived={() => { setReceiveOpen(false); loadPo(); }}
        />
      )}
    </>
  );
}

function ReceiveShipmentModal({ storeId, po, onClose, onReceived }: {
  storeId: string; po: PurchaseOrder; onClose: () => void; onReceived: () => void;
}) {
  const toast = useToast();
  const pending = po.items.filter(i => (i.quantityReceived + i.quantityDamaged) < i.quantityOrdered);
  const [lines, setLines] = useState<Record<string, { receiving: string; damaged: string }>>(
    Object.fromEntries(pending.map(i => [i._id, { receiving: String(i.quantityOrdered - i.quantityReceived - i.quantityDamaged), damaged: '0' }])),
  );
  const [submitting, setSubmitting] = useState(false);
  // Generated once when this modal mounts (not per submit) — a retry of
  // the same submission (network hiccup, an impatient double-click before
  // the button disables) reuses the same key, so the backend's
  // IdempotencyInterceptor can't double-credit stock for one shipment.
  const [idempotencyKey] = useState(() => `po-receive-${po._id}-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const handleSubmit = async () => {
    const items = Object.entries(lines)
      .map(([itemId, v]) => ({ itemId, quantityReceived: parseInt(v.receiving, 10) || 0, quantityDamaged: parseInt(v.damaged, 10) || 0 }))
      .filter(l => l.quantityReceived > 0 || l.quantityDamaged > 0);
    if (items.length === 0) { toast.error('Enter a quantity for at least one item.'); return; }
    setSubmitting(true);
    try {
      const res = await apiReceivePurchaseOrder(storeId, po._id, items, idempotencyKey);
      if (res.data.discrepancies.length > 0) {
        toast.error(res.data.discrepancies.join(' · '));
      } else {
        toast.success('Shipment received.');
      }
      onReceived();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to receive shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Receive Shipment" onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} loading={submitting}>Confirm Receipt</Button>
      </>
    }>
      <div className="flex flex-col gap-3">
        {pending.length === 0 ? (
          <p className="text-[12.5px] text-slate py-2">Every line has already been fully received.</p>
        ) : (
          pending.map(item => {
            const remaining = item.quantityOrdered - item.quantityReceived - item.quantityDamaged;
            return (
              <div key={item._id} className="flex items-center gap-3 p-2.5 rounded-lg border border-bone">
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.name}</p>
                  <p className="text-[10.5px] text-slate">{remaining} remaining of {item.quantityOrdered}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate block">Receiving</label>
                  <input type="number" min={0} className="w-16 px-2 py-1.5 text-[12px] border border-bone rounded-md text-center"
                    value={lines[item._id]?.receiving ?? '0'}
                    onChange={e => setLines(prev => ({ ...prev, [item._id]: { ...prev[item._id], receiving: e.target.value } }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate block">Damaged</label>
                  <input type="number" min={0} className="w-16 px-2 py-1.5 text-[12px] border border-bone rounded-md text-center"
                    value={lines[item._id]?.damaged ?? '0'}
                    onChange={e => setLines(prev => ({ ...prev, [item._id]: { ...prev[item._id], damaged: e.target.value } }))} />
                </div>
              </div>
            );
          })
        )}
        <p className="text-[11px] text-slate">
          You can receive a shipment in more than one part — just come back and receive again once the rest arrives.
          Receiving more than what's remaining is allowed (a supplier can over-ship) and will be flagged.
        </p>
      </div>
    </Modal>
  );
}
