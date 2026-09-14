import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Search } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, MetricCard } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { currencySymbol } from '@/utils/currency';
import { apiListPurchaseOrders, type PurchaseOrder, type PurchaseOrderStatus } from '@/api/services/purchaseOrders';

const STATUS_META: Record<PurchaseOrderStatus, { label: string; color: 'gray' | 'blue' | 'orange' | 'green' | 'red' }> = {
  draft:               { label: 'Draft',              color: 'gray'   },
  ordered:             { label: 'Ordered',             color: 'blue'   },
  partially_received:  { label: 'Partially Received',  color: 'orange' },
  received:            { label: 'Received',            color: 'green'  },
  closed_short:        { label: 'Closed Short',         color: 'gray'   },
  cancelled:           { label: 'Cancelled',            color: 'red'    },
};

const STATUS_TABS: (PurchaseOrderStatus | '')[] = ['', 'draft', 'ordered', 'partially_received', 'received'];

// Real supplier purchasing + receiving — the "buy stock in" half of
// inventory that never existed before (Inventory itself only ever covered
// stock already on hand). Mirrors DraftOrdersList/DraftOrderForm's
// list+detail split, the closest existing analog in this codebase.
export default function PurchaseOrdersList() {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiListPurchaseOrders(storeId, { status: statusFilter || undefined, search: search || undefined, limit: 50 })
      .then(res => { setItems(res.data.items); setCounts(res.data.counts); })
      .finally(() => setLoading(false));
  }, [storeId, statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCount = (counts.ordered ?? 0) + (counts.partially_received ?? 0);

  return (
    <>
      <StorePageHeader
        title="Purchase Orders"
        subtitle="Order and receive stock from your suppliers."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/reorder-suggestions`)}>Reorder Suggestions</Button>
            <Button icon={<Plus size={13} />} size="sm" onClick={() => navigate(`/store/${storeId}/purchase-orders/new`)}>New Purchase Order</Button>
          </div>
        }
      />

      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Draft" value={counts.draft ?? 0} />
          <MetricCard label="Awaiting Receipt" value={openCount} />
          <MetricCard label="Received" value={counts.received ?? 0} />
          <MetricCard label="Total" value={items.length ? Object.values(counts).reduce((a, b) => a + b, 0) : 0} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${statusFilter === s ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
                {s === '' ? 'All' : STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-[240px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search PO # or supplier…"
              className="w-full pl-8 pr-3 py-2 text-[12.5px] border border-bone rounded-lg outline-none bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="10px" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Truck size={28} className="text-brand-orange opacity-55" />}
            title="No purchase orders yet"
            description="Create one to order and track stock coming in from a supplier."
            action={{ label: 'New Purchase Order', onClick: () => navigate(`/store/${storeId}/purchase-orders/new`), icon: <Plus size={14} /> }}
          />
        ) : (
          <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
            {items.map(po => (
              <button key={po._id} type="button" onClick={() => navigate(`/store/${storeId}/purchase-orders/${po._id}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-cream transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-charcoal truncate">{po.poNumber} · {po.supplierName}</p>
                  <p className="text-[11px] text-slate">
                    {po.items.length} item{po.items.length !== 1 ? 's' : ''} · {new Date(po.createdAt).toLocaleDateString()}
                    {po.expectedAt ? ` · expected ${new Date(po.expectedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[13px] font-bold text-charcoal">{currencySymbol(po.currency ?? store?.baseCurrency ?? 'USD')}{po.total.toFixed(2)}</span>
                  <Badge color={STATUS_META[po.status].color} size="sm">{STATUS_META[po.status].label}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
