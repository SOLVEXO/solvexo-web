import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { currencySymbol } from '@/utils/currency';
import { apiListDraftOrders, type DraftOrder } from '@/api/services/draftOrders';

const STATUS_COLOR: Record<DraftOrder['status'], 'gray' | 'green' | 'red'> = {
  open: 'gray', completed: 'green', cancelled: 'red',
};

// Merchant-created orders (Shopify "Draft Orders" equivalent) — a seller
// builds one manually for a phone/in-person/wholesale sale, prices it
// exactly as they choose, then converts it into a real Order once the
// customer/payment is settled. See DraftOrderForm.tsx for the editor.
export default function DraftOrdersList() {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();
  const [items, setItems] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = useCallback(() => {
    setLoading(true);
    apiListDraftOrders(storeId, { status: statusFilter || undefined, limit: 50 })
      .then(res => setItems(res.data.items))
      .finally(() => setLoading(false));
  }, [storeId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <StorePageHeader
        title="Draft Orders"
        subtitle="Create an order manually for a phone, in-person, or wholesale sale."
        actions={<Button icon={<Plus size={13} />} size="sm" onClick={() => navigate(`/store/${storeId}/draft-orders/new`)}>Create Draft Order</Button>}
      />

      <div className="px-4 lg:px-7 pt-5 pb-8">
        <div className="flex gap-1 mb-4">
          {(['', 'open', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${statusFilter === s ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
              {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="10px" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} className="text-brand-orange opacity-55" />}
            title="No draft orders yet"
            description="Create one to record a sale made outside the normal checkout flow."
            action={{ label: 'Create Draft Order', onClick: () => navigate(`/store/${storeId}/draft-orders/new`), icon: <Plus size={14} /> }}
          />
        ) : (
          <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
            {items.map(d => (
              <button key={d._id} type="button" onClick={() => navigate(`/store/${storeId}/draft-orders/${d._id}`)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer hover:bg-cream transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-charcoal truncate">{d.customerName}</p>
                  <p className="text-[11px] text-slate">{d.items.length} item{d.items.length !== 1 ? 's' : ''} · {new Date(d.createdAt).toLocaleDateString()}{d.orderNumber ? ` · ${d.orderNumber}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[13px] font-bold text-charcoal">{currencySymbol(d.currency ?? store?.baseCurrency ?? 'USD')}{d.total.toFixed(2)}</span>
                  <Badge color={STATUS_COLOR[d.status]} size="sm">{d.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
