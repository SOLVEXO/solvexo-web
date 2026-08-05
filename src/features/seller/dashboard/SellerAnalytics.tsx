import { Store } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { EmptyState, FilterDropdown, SkeletonBox } from '@/components/comman/ui';
import { useActiveStore } from '@/contexts/ActiveStoreContext';
import { SellerAnalyticsView } from '@/features/seller/components/analytics/SellerAnalyticsView';

/**
 * Top-level (not store-scoped-by-URL) analytics entry point. Resolves "which
 * store" via the app-wide `useActiveStore()` context (the same store switcher the
 * seller sidebar already uses) instead of a URL param — including its "All Stores"
 * option (`activeStoreId === 'all'`), which now aggregates across every store the
 * seller owns instead of picking one (the seller analytics backend supports both).
 */
export function SellerAnalytics() {
  usePageTitle('Analytics');
  const { stores, activeStoreId, loading, switchStore } = useActiveStore();

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

  const storeId = activeStoreId === 'all' ? null : activeStoreId;
  const currency = storeId ? stores.find(s => s._id === storeId)?.baseCurrency ?? null : null;

  return (
    <>
      <SellerPageHeader
        title="Analytics"
        subtitle={storeId ? 'Understand your store performance and growth trends.' : 'Combined performance and growth trends across every store you own.'}
        actions={stores.length > 1 ? (
          <FilterDropdown
            options={[{ value: 'all', label: 'All Stores' }, ...stores.map(s => ({ value: s._id, label: s.name }))]}
            value={activeStoreId}
            onChange={switchStore}
          />
        ) : undefined}
      />

      <div className="px-7 pt-5 pb-8">
        <SellerAnalyticsView storeId={storeId} currency={currency} />
      </div>
    </>
  );
}
