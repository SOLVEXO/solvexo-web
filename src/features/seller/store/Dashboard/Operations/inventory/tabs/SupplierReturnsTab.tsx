import { useCallback, useEffect, useState } from 'react';
import { Undo2, Plus } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Pagination } from '@/components/comman/ui';
import { SupplierReturnModal } from '../SupplierReturnModal';
import { downloadBlob } from '@/utils/downloadBlob';
import { SUPPLIER_RETURN_REASONS as REASONS } from '../supplierReturnReasons';
import { Button } from '@/components/comman/ui/Button';
import { currencySymbol } from '@/utils/currency';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import {
  apiListSupplierReturns, apiMarkSupplierReturnCredit, apiExportSupplierReturnsCsv,
  type SupplierReturn,
} from '@/api/services/inventoryOps';

const PER_PAGE = 20;

/** Goods sent back to a supplier. Creating a return removes the units from stock right away (one all-or-nothing server
 *  transaction), re-weights the product's average cost, and tracks the credit the supplier owes until you mark it received. */
export default function SupplierReturnsTab() {
  const { storeId, store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  // returning stock removes inventory, so (for staff) it needs the same permission as a manual adjustment; the server also checks
  const canReturn = hasNavPermission(user as never, ['inventory.adjust']);
  const canManage = hasNavPermission(user as never, ['purchase_orders.manage']);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SupplierReturn[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportCsv = () => {
    setExporting(true);
    apiExportSupplierReturnsCsv(storeId)
      .then(blob => downloadBlob(blob, `supplier-returns-${new Date().toISOString().slice(0, 10)}.csv`))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not export the returns.'))
      .finally(() => setExporting(false));
  };

  const load = useCallback(() => {
    apiListSupplierReturns(storeId, { page, limit: PER_PAGE })
      .then(res => { setRows(res.data); setTotal(res.meta?.total ?? res.data.length); setError(''); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load supplier returns.'))
      .finally(() => setLoading(false));
  }, [storeId, page]);
  useEffect(() => { load(); }, [load]);

  const markCredit = async (id: string) => {
    setBusyId(id);
    try { await apiMarkSupplierReturnCredit(storeId, id); setLoading(true); load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not update the credit.'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-[12px] pointer-coarse:text-[13px] text-slate max-w-[520px]">Send stock back to a supplier. Units leave your inventory immediately and the supplier’s credit is tracked here.</p>
        <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" loading={exporting} onClick={exportCsv}>Export CSV</Button>
        {canReturn
          ? <Button size="sm" icon={<Plus size={13} />} onClick={() => setCreating(true)}>New return</Button>
          : <p className="text-[11px] text-slate">You need the “adjust inventory” permission to create returns.</p>}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-bone p-4 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-error">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => { setLoading(true); load(); }}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={64} rounded="10px" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<Undo2 size={28} className="text-brand-orange opacity-55" />} title="No supplier returns yet" description="Create one when you send damaged, wrong or surplus goods back to a supplier." />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {rows.map(r => (
            <div key={r._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal sm:truncate">{r.returnNumber} · {r.supplierName}</p>
                <p className="text-[11px] pointer-coarse:text-[13px] text-slate sm:truncate">
                  {new Date(r.createdAt).toLocaleDateString()} · {REASONS.find(x => x.value === r.reason)?.label} · {r.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                <span className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-[13px] pointer-coarse:text-[15px] font-bold text-charcoal shrink-0">{symbol}{r.totalCredit.toLocaleString()}</span>
                  <Badge color={r.creditStatus === 'received' ? 'green' : 'orange'} size="sm">{r.creditStatus === 'received' ? 'Credit received' : 'Credit pending'}</Badge>
                </span>
                {r.creditStatus === 'pending' && canManage && <Button size="sm" variant="secondary" loading={busyId === r._id} onClick={() => void markCredit(r._id)}>Mark received</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && <Pagination page={page} total={total} perPage={PER_PAGE} onChange={p => { setLoading(true); setPage(p); }} />}

      {creating && <SupplierReturnModal storeId={storeId} onClose={() => setCreating(false)} onDone={() => { setCreating(false); setLoading(true); setPage(1); load(); }} />}
    </div>
  );
}
