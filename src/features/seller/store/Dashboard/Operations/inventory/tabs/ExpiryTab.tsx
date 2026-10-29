import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, SearchInput, Pagination, Select, Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { currencySymbol } from '@/utils/currency';
import { apiListLots, apiWriteOffLot, apiExportLotsCsv, type LotFilter, type StockLotRow } from '@/api/services/inventoryOps';
import { downloadBlob } from '@/utils/downloadBlob';

const PER_PAGE = 20;
const FILTERS: { value: LotFilter; label: string }[] = [
  { value: 'expired',  label: 'Expired' },
  { value: 'expiring', label: 'Expiring in 30 days' },
  { value: 'all',      label: 'All lots' },
];

/** Lot-tracked stock with its expiry: what has expired, what is about to, and a write-off that removes the units for good
 *  (lot + stock + audit row change together on the server). Only variants with "track lots" switched on have lots. */
export default function ExpiryTab() {
  const { storeId, store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canWriteOff = hasNavPermission(user as never, ['inventory.approve']);
  const [filter, setFilter] = useState<LotFilter>('expired');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StockLotRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<StockLotRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportCsv = () => {
    setExporting(true);
    apiExportLotsCsv(storeId)
      .then(blob => downloadBlob(blob, `inventory-lots-${new Date().toISOString().slice(0, 10)}.csv`))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not export the lots.'))
      .finally(() => setExporting(false));
  };

  const load = useCallback(() => {
    apiListLots(storeId, { filter, q: q || undefined, page, limit: PER_PAGE })
      .then(res => { setRows(res.data); setTotal(res.meta?.total ?? res.data.length); setError(''); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load lots.'))
      .finally(() => setLoading(false));
  }, [storeId, filter, q, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="sm:w-56">
          <Select label="Show" value={filter} onChange={e => { setLoading(true); setFilter(e.target.value as LotFilter); setPage(1); }}>
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </div>
        <div className="flex-1"><SearchInput value={q} onChange={v => { setLoading(true); setQ(v); setPage(1); }} placeholder="Search product, SKU or lot number" /></div>
      </div>

      <div className="flex justify-end -mt-2"><Button size="sm" variant="secondary" loading={exporting} onClick={exportCsv}>Export CSV</Button></div>

      {error ? (
        <div role="alert" className="rounded-xl border border-bone p-4 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-error">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={64} rounded="10px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={28} className="text-brand-orange opacity-55" />}
          title={filter === 'expired' ? 'Nothing has expired' : filter === 'expiring' ? 'Nothing expires in the next 30 days' : 'No lots yet'}
          description="Lots are created when you receive a purchase order for a product that has “track lots” switched on."
        />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {rows.map(l => (
            <div key={l._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal sm:truncate">{l.productName}{l.options.length ? ` — ${l.options.map(o => o.value).join(' / ')}` : ''}</p>
                <p className="text-[11px] pointer-coarse:text-[13px] text-slate">Lot {l.lotNumber} · SKU {l.sku ?? '—'} · {l.quantityRemaining} of {l.quantityReceived} left · {symbol}{l.valueRemaining.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                {l.expiryDate ? (
                  <Badge className="pointer-coarse:text-[13px]" color={l.isExpired ? 'red' : (l.daysToExpiry ?? 99) <= 30 ? 'orange' : 'gray'} size="sm">
                    {l.isExpired ? `Expired ${new Date(l.expiryDate).toLocaleDateString()}` : `${l.daysToExpiry}d · ${new Date(l.expiryDate).toLocaleDateString()}`}
                  </Badge>
                ) : <Badge className="pointer-coarse:text-[13px]" color="gray" size="sm">No expiry</Badge>}
                {canWriteOff && <Button size="sm" variant="secondary" icon={<Trash2 size={13} className="pointer-coarse:size-4" />} onClick={() => setTarget(l)}>Write off</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => { setLoading(true); setPage(p); }} />}

      {target && <WriteOffModal storeId={storeId} lot={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); setLoading(true); load(); }} />}
    </div>
  );
}

function WriteOffModal({ storeId, lot, onClose, onDone }: { storeId: string; lot: StockLotRow; onClose: () => void; onDone: () => void }) {
  const [qty, setQty] = useState(String(lot.quantityRemaining));
  const [reason, setReason] = useState<'expired' | 'damaged'>(lot.isExpired ? 'expired' : 'damaged');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const n = Number(qty);
  const valid = Number.isInteger(n) && n > 0 && n <= lot.quantityRemaining;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await apiWriteOffLot(storeId, lot._id, { quantity: n, reason, note: note.trim() || undefined });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Write-off failed.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Write off stock" onClose={onClose} width={440} mobileSheet
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={submit} loading={busy} disabled={!valid}>Write off {valid ? n : ''}</Button></div>}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-slate">{lot.productName} · lot {lot.lotNumber}. These units are removed from your stock for good and the change is recorded in the stock history.</p>
        <Input label={`Quantity (max ${lot.quantityRemaining})`} type="number" min={1} max={lot.quantityRemaining} step={1} inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} />
        <Select label="Reason" value={reason} onChange={e => setReason(e.target.value as 'expired' | 'damaged')}>
          <option value="expired">Expired</option>
          <option value="damaged">Damaged / spoiled</option>
        </Select>
        <Input label="Note (optional)" value={note} maxLength={300} onChange={e => setNote(e.target.value)} />
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
