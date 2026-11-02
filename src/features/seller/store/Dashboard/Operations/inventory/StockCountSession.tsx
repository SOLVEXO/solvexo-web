import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, CheckCircle2, XCircle, ClipboardCheck, Printer, FileText } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Modal } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/api/services/auth';
import { buildCountReportHtml, buildCountSheetHtml, openCountDocument, type SheetOptions } from '@/utils/stockCountDocuments';
import { ConfirmDialog } from '@/features/seller/store/Dashboard/OnlineStore/builder/ConfirmDialog';
import {
  apiGetStockCount, apiSubmitStockCountItem, apiCancelStockCount, apiFinishStockCount,
  type StockCount, type StockCountItem,
} from '@/api/services/stockCounts';

// A real, full-screen focused counting UI — a top search/SKU-entry field
// that jumps to & focuses the matching row (mirrors a real retail
// stocktake app), a scrollable line list, a running progress indicator,
// and a discrepancy review screen before anything ever touches real stock
// (StockCountsService.finish never auto-applies silently).
export default function StockCountSession() {
  const { storeId, store } = useStoreWorkspace();
  const { countId } = useParams<{ countId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [count, setCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetOpts, setSheetOpts] = useState<SheetOptions>({ showSystemQty: false, showPhotos: false });
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Generated once per page mount (one count session = one finish action,
  // retried at most) — reused across a retry so the backend's
  // IdempotencyInterceptor can't double-apply the same adjustments.
  const [finishIdempotencyKey] = useState(() => `stock-count-finish-${countId}-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const load = useCallback(() => {
    if (!countId) return;
    apiGetStockCount(storeId, countId).then(res => setCount(res.data)).finally(() => setLoading(false));
  }, [storeId, countId]);

  useEffect(() => { load(); }, [load]);

  const items = count?.items ?? [];
  const countedCount = items.filter(i => i.countedQty != null).length;
  const discrepancies = items.filter(i => i.countedQty != null && i.countedQty !== i.systemQty);

  const matches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return items.filter(i => i.sku?.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q) || i.variantLabel?.toLowerCase().includes(q));
  }, [items, search]);

  const jumpToFirstMatch = () => {
    const first = matches[0];
    if (first) inputRefs.current[first._id]?.focus();
  };

  const handleCount = async (item: StockCountItem, value: string) => {
    if (!countId || value.trim() === '') return;
    const qty = Math.max(0, parseInt(value, 10));
    if (!Number.isFinite(qty)) return;
    setSavingId(item._id);
    try {
      const res = await apiSubmitStockCountItem(storeId, countId, item._id, qty);
      setCount(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save count.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = async () => {
    if (!countId) return;
    await apiCancelStockCount(storeId, countId);
    toast.success('Stock count cancelled — no stock was changed.');
    navigate(`/store/${storeId}/inventory`);
  };

  const handleFinish = async () => {
    if (!countId) return;
    setFinishing(true);
    try {
      const res = await apiFinishStockCount(storeId, countId, finishIdempotencyKey);
      toast.success(`Stock count completed — ${res.data.applied} SKU(s) adjusted.`);
      navigate(`/store/${storeId}/inventory`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to finish stock count.');
    } finally {
      setFinishing(false);
      setReviewing(false);
    }
  };

  const docStore = () => ({ name: store?.name ?? 'Store', printedBy: (() => { const n = TokenStorage.getUser()?.name; return typeof n === 'string' ? n : null; })() });
  const printSheet = () => {
    if (!count) return;
    if (!openCountDocument(buildCountSheetHtml(count, docStore(), sheetOpts))) toast.error('Allow pop-ups for this site to print.');
    setSheetOpen(false);
  };
  const printReport = () => {
    if (!count) return;
    if (!openCountDocument(buildCountReportHtml(count, docStore()))) toast.error('Allow pop-ups for this site to print.');
  };

  if (loading) return <div className="px-4 lg:px-7 py-8 text-[13px] text-slate">Loading…</div>;
  if (!count) return <div className="px-4 lg:px-7 py-8 text-[13px] text-error">Stock count not found.</div>;

  return (
    <>
      <StorePageHeader
        title="Stock Count"
        subtitle={`${countedCount} / ${items.length} counted`}
        actions={
          <div className="flex flex-wrap gap-2">
            {count.status === 'open' && <Button variant="outline" size="sm" icon={<Printer size={13} />} onClick={() => setSheetOpen(true)}>Print count sheet</Button>}
            <Button variant="outline" size="sm" icon={<FileText size={13} />} onClick={printReport}>Count report</Button>
            {count.status === 'open' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>Cancel Count</Button>
                <Button size="sm" variant="primary" icon={<ClipboardCheck size={13} />} onClick={() => setReviewing(true)}>Review & Finish</Button>
              </>
            )}
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-10 flex flex-col gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') jumpToFirstMatch(); }}
            placeholder="Scan or type a SKU / product name, then press Enter…"
            className="w-full pl-9 pr-3 py-2.5 text-[13.5px] border border-bone rounded-lg outline-none bg-white focus:ring-2 focus:ring-brand-orange/40"
            disabled={count.status !== 'open'}
          />
        </div>

        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {items.map(item => {
            const isMatch = search.trim() && matches.some(m => m._id === item._id);
            const hasDiscrepancy = item.countedQty != null && item.countedQty !== item.systemQty;
            return (
              <div
                key={item._id}
                className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3.5 sm:py-2.5 ${isMatch ? 'bg-brand-pale-orange' : ''}`}
              >
                <div className="w-9 h-9 rounded-lg bg-cream border border-bone shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] pointer-coarse:text-[15px] font-semibold text-charcoal sm:truncate">{item.productName}{item.variantLabel && <span className="ml-2 rounded-md bg-brand-pale-orange px-1.5 py-0.5 text-[11px] pointer-coarse:text-[13px] font-semibold text-brand-orange">{item.variantLabel}</span>}</p>
                  <p className="text-[11px] pointer-coarse:text-[13px] text-slate">SKU: {item.sku ?? '—'} · System: {item.systemQty}</p>
                </div>
                {item.countedQty != null && (
                  hasDiscrepancy
                    ? <XCircle size={14} className="text-error shrink-0" />
                    : <CheckCircle2 size={14} className="text-success shrink-0" />
                )}
                <input
                  ref={el => { inputRefs.current[item._id] = el; }}
                  type="number"
                  min={0}
                  defaultValue={item.countedQty ?? ''}
                  placeholder="Count"
                  disabled={count.status !== 'open' || savingId === item._id}
                  onBlur={e => handleCount(item, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-full sm:w-20 px-2 py-2.5 sm:py-1.5 text-[15px] sm:text-[13px] border border-bone rounded-md text-center shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                />
              </div>
            );
          })}
        </div>
      </div>

      {confirmingCancel && (
        <ConfirmDialog
          title="Cancel this stock count?"
          message="No stock will be changed. All counts entered so far will be discarded."
          confirmLabel="Cancel Count"
          onConfirm={handleCancel}
          onCancel={() => setConfirmingCancel(false)}
        />
      )}

      {sheetOpen && (
        <Modal title="Print count sheet" onClose={() => setSheetOpen(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={<Printer size={13} />} onClick={printSheet}>Print / Save as PDF</Button>
          </>
        }>
          <p className="text-[13px] text-slate mb-3">A sheet with every line and an empty box to write the counted quantity by hand. Take it to the shelves, then enter the numbers here.</p>
          <label className="flex items-start gap-2 text-[13px] text-charcoal mb-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={sheetOpts.showSystemQty} onChange={e => setSheetOpts(o => ({ ...o, showSystemQty: e.target.checked }))} />
            <span>Show the system quantity<span className="block text-[12px] text-slate">Off is better: the counter writes what is really there, not what the computer says.</span></span>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-charcoal cursor-pointer">
            <input type="checkbox" checked={sheetOpts.showPhotos} onChange={e => setSheetOpts(o => ({ ...o, showPhotos: e.target.checked }))} />
            <span>Show small product photos</span>
          </label>
        </Modal>
      )}

      {reviewing && (
        <Modal title="Review Discrepancies" onClose={() => setReviewing(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setReviewing(false)}>Back</Button>
            <Button variant="outline" icon={<FileText size={13} />} onClick={printReport}>Download report</Button>
            <Button variant="primary" onClick={handleFinish} loading={finishing}>
              {discrepancies.length > 0 ? `Apply ${discrepancies.length} Adjustment(s)` : 'Finish Count'}
            </Button>
          </>
        }>
          <div className="flex flex-col gap-3">
            {items.length - countedCount > 0 && (
              <p className="text-[12px] text-slate bg-cream rounded-lg px-3 py-2">
                {items.length - countedCount} SKU(s) weren't counted — they'll be left untouched.
              </p>
            )}
            {discrepancies.length === 0 ? (
              <p className="text-[12.5px] text-slate py-4 text-center">No discrepancies — every counted SKU matches the system quantity.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#f3f2ec] max-h-[340px] overflow-y-auto">
                {discrepancies.map(item => {
                  const delta = (item.countedQty ?? 0) - item.systemQty;
                  return (
                    <div key={item._id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.productName}{item.variantLabel ? ` — ${item.variantLabel}` : ''}</p>
                        <p className="text-[11px] text-slate">System: {item.systemQty} → Counted: {item.countedQty}</p>
                      </div>
                      <span className={`text-[12px] font-bold shrink-0 ${delta > 0 ? 'text-success' : 'text-error'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
