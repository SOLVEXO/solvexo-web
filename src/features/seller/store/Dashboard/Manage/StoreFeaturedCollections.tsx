import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Star, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, Button } from '@/components/comman/ui';
import { apiUpdatePinnedProducts } from '@/api/services/store';
import { apiGetStoreInventory, type InventoryProduct } from '@/api/services/product';

// ── Extracted out of Marketing.tsx — same relocation as StoreBanners.tsx
// (see its doc comment). Same `apiUpdatePinnedProducts`/`apiGetStoreInventory`
// calls, same pinned-product-ids-on-Store shape. ──

export default function StoreFeaturedCollections() {
  const { store, storeId } = useStoreWorkspace();

  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [pinnedSaving, setPinnedSaving] = useState(false);
  const [pinnedError, setPinnedError] = useState('');
  const [pinnedSaved, setPinnedSaved] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    setPinnedIds(store?.pinnedProductIds ?? []);
    setInventoryLoading(true);
    // Pinned products are resolved to name/thumbnail by matching against this
    // list client-side (no batch product-by-ids endpoint exists yet) — fetch
    // a large page so a pinned product elsewhere in a large catalog still
    // resolves instead of falling back to its raw id.
    apiGetStoreInventory(storeId, 1, 500)
      .then(res => setInventory(res.data.products ?? []))
      .catch(() => {})
      .finally(() => setInventoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function togglePin(productId: string) {
    setPinnedSaved(false);
    setPinnedIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  }

  function movePinned(index: number, dir: -1 | 1) {
    setPinnedSaved(false);
    setPinnedIds(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function savePinnedProducts() {
    setPinnedSaving(true);
    setPinnedError('');
    try {
      await apiUpdatePinnedProducts(storeId, pinnedIds);
      setPinnedSaved(true);
    } catch (err) {
      setPinnedError(err instanceof Error ? err.message : 'Failed to save featured products.');
    } finally {
      setPinnedSaving(false);
    }
  }

  return (
    <div>
      <StorePageHeader
        title="Featured Products"
        subtitle="Pin products to the top of your storefront. Best Sellers, New Arrivals, and Trending sections are automatic — no setup needed."
        actions={<Button onClick={savePinnedProducts} loading={pinnedSaving}>Save Order</Button>}
      />

      <div className="p-4 md:p-7 flex flex-col gap-4">
        {pinnedError && <p className="text-xs text-error">{pinnedError}</p>}
        {pinnedSaved && <p className="text-xs text-success">Saved.</p>}

        {pinnedIds.length > 0 && (
          <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
            <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] mb-2">Pinned Order</p>
            {inventoryLoading ? (
              <div className="flex flex-col gap-1.5">
                {pinnedIds.map(id => <div key={id} className="h-8 rounded-lg bg-cream animate-pulse" />)}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {pinnedIds.map((id, i) => {
                  const product = inventory.find(p => p.productId === id);
                  return (
                    <div key={id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cream">
                      <span className="text-[11px] text-slate w-4">{i + 1}</span>
                      {product?.image && <img src={product.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />}
                      <span className="text-[13px] text-charcoal flex-1 truncate">{product?.name ?? 'Unknown product'}</span>
                      <button onClick={() => movePinned(i, -1)} disabled={i === 0} className="p-1 rounded-md border-0 bg-transparent cursor-pointer disabled:opacity-30 hover:bg-bone"><ArrowUp size={13} /></button>
                      <button onClick={() => movePinned(i, 1)} disabled={i === pinnedIds.length - 1} className="p-1 rounded-md border-0 bg-transparent cursor-pointer disabled:opacity-30 hover:bg-bone"><ArrowDown size={13} /></button>
                      <button onClick={() => togglePin(id)} className="p-1 rounded-md border-0 bg-transparent cursor-pointer hover:bg-bone text-error"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
          <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] mb-2">All Products</p>
          {inventoryLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={36} rounded="8px" />)}</div>
          ) : (
            <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto">
              {inventory.map(p => (
                <label key={p.productId} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-cream">
                  <input type="checkbox" checked={pinnedIds.includes(p.productId)} onChange={() => togglePin(p.productId)} className="cursor-pointer" />
                  {p.image && <img src={p.image} alt="" className="w-7 h-7 rounded-md object-cover" />}
                  <span className="text-[13px] text-charcoal flex-1 truncate">{p.name}</span>
                  <Star size={13} className={pinnedIds.includes(p.productId) ? 'text-brand-orange fill-brand-orange' : 'text-bone'} />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
