import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { apiListStockCounts, apiStartStockCount, type StockCount, type StockCountStatus } from '@/api/services/stockCounts';

const STATUS_META: Record<StockCountStatus, { label: string; color: 'gray' | 'blue' | 'green' | 'red' }> = {
  open:      { label: 'In Progress', color: 'blue'  },
  completed: { label: 'Completed',   color: 'green' },
  cancelled: { label: 'Cancelled',   color: 'gray'   },
};

/** "Stock Counts" tab of the Inventory hub — history of past/in-progress
 *  cycle counts + a "Start New Count" action. The actual counting session
 *  (search-and-enter-quantities UI, discrepancy review) stays its own
 *  routed page (`StockCountSession.tsx`, `/inventory/count/:countId`) —
 *  this tab is just the launch point + history list, mirroring how
 *  Purchase Orders' list/detail split works. */
export default function StockCountsTab() {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiListStockCounts(storeId).then(res => setCounts(res.data)).finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const hasOpen = counts.some(c => c.status === 'open');

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await apiStartStockCount(storeId);
      navigate(`/store/${storeId}/inventory/count/${res.data._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start a stock count.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-slate max-w-[520px]">
          A real physical count — snapshot today's book quantities, count each SKU one at a time, then review and apply only what's actually different.
        </p>
        <Button size="sm" icon={<ClipboardCheck size={13} />} onClick={handleStart} loading={starting} disabled={hasOpen}>
          {hasOpen ? 'A count is already open' : 'Start New Count'}
        </Button>
      </div>
      {error && <p className="text-[12px] text-error">{error}</p>}

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={52} rounded="10px" />)}</div>
      ) : counts.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={28} className="text-brand-orange opacity-55" />}
          title="No stock counts yet"
          description="Start one to verify your book stock against what's actually on the shelf."
        />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {counts.map(c => (
            <button
              key={c._id} type="button"
              onClick={() => navigate(`/store/${storeId}/inventory/count/${c._id}`)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-cream transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-charcoal truncate">
                  Count started {new Date(c.startedAt).toLocaleDateString()} · {c.items.length} SKU{c.items.length !== 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-slate">
                  {c.items.filter(i => i.countedQty != null).length} of {c.items.length} counted
                </p>
              </div>
              <Badge color={STATUS_META[c.status].color} size="sm">{STATUS_META[c.status].label}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
