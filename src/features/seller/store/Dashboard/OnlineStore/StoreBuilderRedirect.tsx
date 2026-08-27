import { Navigate } from 'react-router-dom';
import { useActiveStore } from '@/contexts/ActiveStoreContext';
import { SkeletonBox } from '@/components/comman/ui';

// The seller-level `/seller/store` route has no specific store in context
// (unlike `/store/:storeId/storebuilder`, nested under `StoreLayout`,
// which the real `StoreBuilder` needs). Each store's storefront content
// (pages, theme, header/footer) is now genuinely per-store, so there's no
// meaningful "edit all stores at once" mode to fall back to — this just
// sends the seller to their active (or first) store's own builder.
export function StoreBuilderRedirect() {
  const { activeStoreId, activeStore, stores, loading } = useActiveStore();

  if (loading) return <div className="p-7"><SkeletonBox height={200} rounded="12px" /></div>;

  const targetId = activeStoreId !== 'all' ? activeStoreId : (activeStore?._id ?? stores[0]?._id);
  if (!targetId) {
    return (
      <div className="p-10 text-center">
        <p className="text-[14px] text-slate">Create a store first to design its storefront.</p>
      </div>
    );
  }

  return <Navigate to={`/store/${targetId}/online-store/themes`} replace />;
}
