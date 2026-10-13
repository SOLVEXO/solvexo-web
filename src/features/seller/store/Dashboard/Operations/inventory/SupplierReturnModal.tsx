import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SearchInput, Select, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol } from '@/utils/currency';
import { apiListSuppliers, type Supplier } from '@/api/services/purchaseOrders';
import { apiGetStockLines, type StockLine } from '@/api/services/product';
import { apiCreateSupplierReturn, type SupplierReturnReason } from '@/api/services/inventoryOps';
import { SUPPLIER_RETURN_REASONS } from './supplierReturnReasons';

export interface ReturnLine { variantId: string; name: string; sku: string; max: number; quantity: string; unitCost: string; purchaseOrderItemId?: string }

/** Create a supplier return, either from scratch (search products) or pre-filled from a purchase order ("Return to supplier"
 *  on the PO page). The server removes the stock in one all-or-nothing step; a staff member below the approval bar gets their
 *  request queued for a manager instead (the response says so). */
export function SupplierReturnModal({ storeId, onClose, onDone, prefill }: {
  storeId: string;
  onClose: () => void;
  onDone: () => void;
  prefill?: { supplierId?: string | null; purchaseOrderId: string; poNumber: string; lines: ReturnLine[] };
}) {
  const { store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState(prefill?.supplierId ?? '');
  const [reason, setReason] = useState<SupplierReturnReason>('damaged');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ReturnLine[]>(prefill?.lines ?? []);
  const [search, setSearch] = useState('');
  const [foundRaw, setFound] = useState<StockLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // generated once per open: a retry/double click can never remove the stock twice
  const [requestId] = useState(() => `sr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fromPo = !!prefill;

  useEffect(() => { apiListSuppliers(storeId).then(res => setSuppliers(res.data.filter(s => s.status === 'active'))).catch(() => setSuppliers([])); }, [storeId]);
  useEffect(() => {
    if (fromPo || search.trim().length < 2) return;
    const t = setTimeout(() => { apiGetStockLines(storeId, 1, 8, search.trim()).then(res => setFound(res.data.lines.filter(l => !l.unlimitedStock))).catch(() => setFound([])); }, 300);
    return () => clearTimeout(t);
  }, [search, storeId, fromPo]);

  const found = search.trim().length < 2 ? [] : foundRaw;
  const add = (l: StockLine) => {
    if (lines.some(x => x.variantId === l.variantId)) return;
    const label = l.options.length ? `${l.productName} — ${l.options.map(o => o.value).join(' / ')}` : l.productName;
    setLines(prev => [...prev, { variantId: l.variantId, name: label, sku: l.sku, max: Math.max(0, l.available), quantity: '1', unitCost: l.costPrice != null ? String(l.costPrice) : '' }]);
    setSearch(''); setFound([]);
  };
  const upd = (id: string, patch: Partial<ReturnLine>) => setLines(prev => prev.map(l => (l.variantId === id ? { ...l, ...patch } : l)));

  const valid = !!supplierId && lines.length > 0 && lines.every(l => Number.isInteger(Number(l.quantity)) && Number(l.quantity) > 0 && Number(l.quantity) <= l.max && (l.unitCost === '' || Number(l.unitCost) >= 0));

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await apiCreateSupplierReturn(storeId, {
        supplierId, reason, note: note.trim() || undefined,
        ...(prefill ? { purchaseOrderId: prefill.purchaseOrderId } : {}),
        items: lines.map(l => ({
          variantId: l.variantId, quantity: Number(l.quantity),
          ...(l.unitCost !== '' ? { unitCost: Number(l.unitCost) } : {}),
          ...(l.purchaseOrderItemId ? { purchaseOrderItemId: l.purchaseOrderItemId } : {}),
        })),
      }, requestId);
      if (res.pendingApproval) toast.success('Sent for manager approval — stock is unchanged until it is approved.');
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create the return.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={fromPo ? `Return to supplier — ${prefill.poNumber}` : 'New supplier return'} onClose={onClose} width={620} mobileSheet
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy} disabled={!valid}>Return stock</Button></div>}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)} disabled={fromPo && !!prefill?.supplierId}>
            <option value="">Choose a supplier…</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <Select label="Reason" value={reason} onChange={e => setReason(e.target.value as SupplierReturnReason)}>
            {SUPPLIER_RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>
        {suppliers.length === 0 && <p className="text-[11.5px] text-slate">Add a supplier first (Purchase Orders tab) so the return can be tracked against them.</p>}

        {!fromPo && (
          <div className="flex flex-col gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search a product or SKU to return" />
            {found.length > 0 && (
              <div className="rounded-lg border border-bone divide-y divide-bone max-h-[180px] overflow-y-auto">
                {found.map(l => (
                  <button key={l.variantId} type="button" onClick={() => add(l)} className="w-full text-left px-3 py-2 bg-transparent border-0 cursor-pointer hover:bg-cream flex justify-between gap-3">
                    <span className="text-[12.5px] text-charcoal truncate">{l.productName}{l.options.length ? ` — ${l.options.map(o => o.value).join(' / ')}` : ''} <span className="text-slate">({l.sku})</span></span>
                    <span className="text-[11.5px] text-slate shrink-0">{l.available} available</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {fromPo && <p className="text-[11.5px] text-slate">Quantities are limited to what this purchase order received and you have not already returned.</p>}

        {lines.map(l => (
          <div key={l.variantId} className="rounded-lg border border-bone p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-charcoal">{l.name} <span className="text-slate font-normal">· {l.sku}</span></p>
              <button type="button" aria-label={`Remove ${l.name}`} onClick={() => setLines(prev => prev.filter(x => x.variantId !== l.variantId))} className="bg-transparent border-0 cursor-pointer text-slate hover:text-error"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label={`Quantity (max ${l.max})`} type="number" min={1} max={l.max} step={1} inputMode="numeric" value={l.quantity} onChange={e => upd(l.variantId, { quantity: e.target.value })} />
              <Input label={`Credit per unit (${symbol}) — optional`} type="number" min={0} step="0.01" inputMode="decimal" value={l.unitCost} onChange={e => upd(l.variantId, { unitCost: e.target.value })} placeholder="uses cost on file" />
            </div>
          </div>
        ))}

        <Input label="Note (optional)" value={note} maxLength={500} onChange={e => setNote(e.target.value)} />
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
