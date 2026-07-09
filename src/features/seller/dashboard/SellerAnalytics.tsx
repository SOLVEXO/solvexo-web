import { useEffect } from 'react';
import { Store } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { EmptyState, FilterDropdown, SkeletonBox } from '@/components/comman/ui';
import { useActiveStore } from '@/contexts/ActiveStoreContext';
import { SellerAnalyticsView } from '@/features/seller/components/analytics/SellerAnalyticsView';

/**
 * Top-level (not store-scoped-by-URL) analytics entry point. The seller analytics
 * backend is always scoped to exactly one store, so this page resolves "which
 * store" via the app-wide `useActiveStore()` context (the same store switcher the
 * seller sidebar already uses) instead of a URL param — defaulting to the seller's
 * first store, with a dropdown to switch when they have more than one.
 */
export function SellerAnalytics() {
  usePageTitle('Analytics');
  const { stores, activeStoreId, activeStore, loading, switchStore } = useActiveStore();

  // "All stores" has no meaning for this backend (every endpoint requires one storeId) —
  // fall back to the first real store the moment we know the seller has any.
  useEffect(() => {
    if (!loading && activeStoreId === 'all' && stores.length > 0) {
      switchStore(stores[0]._id);
    }
  }, [loading, activeStoreId, stores, switchStore]);

  if (loading) {
    return (
      <>
        <SellerPageHeader title="Analytics" subtitle="Understand your store performance and growth trends." />
        <div className="px-7 pt-5 pb-8 flex flex-col gap-3">
          <SkeletonBox height={44} width="100%" rounded="10px" />
          <SkeletonBox height={220} width="100%" rounded="10px" />
        </div>
      </>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <SellerPageHeader title="Analytics" subtitle="Understand your store performance and growth trends." />
        <div className="px-7 pt-5 pb-8">
          <EmptyState
            icon={<Store size={28} className="text-slate" />}
            title="No stores yet"
            description="Create a store to start tracking revenue, orders, customers and product performance."
          />
        </div>
      </>
    );
  }

  const storeId = activeStore?._id ?? stores[0]._id;

  return (
    <>
      <SellerPageHeader
        title="Analytics"
        subtitle="Understand your store performance and growth trends."
        actions={stores.length > 1 ? (
          <FilterDropdown
            options={stores.map(s => ({ value: s._id, label: s.name }))}
            value={storeId}
            onChange={switchStore}
          />
        ) : undefined}
      />

      <div className="px-7 pt-5 pb-8">
        <SellerAnalyticsView storeId={storeId} />
      </div>
    </>
  );
}
