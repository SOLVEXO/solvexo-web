import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Truck } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { apiGetReorderSuggestions, type ReorderSuggestionGroup } from '@/api/services/product';

// Real replenishment view — every low/out-of-stock SKU grouped by whichever
// supplier it was last received from, so a seller generates ONE purchase
// order per supplier covering everything that's low, instead of hunting
// through the Inventory list SKU by SKU (the real Shopify/Zoho pattern).
export default function ReorderSuggestions({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId } = useStoreWorkspace();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ReorderSuggestionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetReorderSuggestions(storeId).then(res => setGroups(res.data.groups)).finally(() => setLoading(false));
  }, [storeId]);

  const createPoForGroup = (group: ReorderSuggestionGroup) => {
    navigate(`/store/${storeId}/purchase-orders/new`, {
      state: {
        supplierId: group.supplierId,
        supplierName: group.supplierId ? group.supplierName : '',
        items: group.items.map(i => ({
          productId: i.productId, variantId: i.variantId, name: i.productName, image: i.image, sku: i.sku,
          // A sensible starting order quantity: bring stock back up to
          // 2x the reorder point — a real starting point the seller can
          // still edit before saving, never auto-submitted.
          quantityOrdered: Math.max(1, i.reorderPoint * 2 - i.available),
        })),
      },
    });
  };

  return (
    <>
      {!embedded && <StorePageHeader title="Reorder Suggestions" subtitle="Every SKU running low, grouped by supplier." />}
      <div className={embedded ? 'px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-4' : 'px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-4'}>
        {loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={100} rounded="10px" />)}</div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Truck size={28} className="text-brand-orange opacity-55" />}
            title="Nothing needs reordering right now"
            description="Every SKU is above its reorder point."
          />
        ) : (
          groups.map(group => (
            <div key={group.supplierId ?? 'unassigned'} className="bg-white rounded-xl border border-bone overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-bone bg-cream">
                <p className="text-[13px] font-bold text-charcoal">{group.supplierName}</p>
                <Button size="xs" variant="primary" onClick={() => createPoForGroup(group)}>Create Purchase Order</Button>
              </div>
              <div className="divide-y divide-bone">
                {group.items.map(item => (
                  <div key={item.variantId} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-cream border border-bone shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-charcoal">{item.available} left</p>
                      {item.daysOfStockLeft != null && (
                        <Badge color={item.daysOfStockLeft <= 7 ? 'red' : 'orange'} size="sm">
                          <AlertTriangle size={9} className="inline mr-1" />
                          ~{item.daysOfStockLeft}d left
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
