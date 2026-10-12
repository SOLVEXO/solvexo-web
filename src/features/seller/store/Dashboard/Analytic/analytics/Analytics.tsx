import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SellerAnalyticsView } from '@/features/seller/components/analytics/SellerAnalyticsView';

export function StoreAnalytics() {
  const { store, storeId } = useStoreWorkspace();

  return (
    <>
      <StorePageHeader
        title="Analytics"
        subtitle="Understand your store performance and growth trends."
      />

      <div className="px-7 pt-5 pb-8">
        {/* key + id check: after a store switch the previous store's currency must never label the new store's numbers */}
        <SellerAnalyticsView key={storeId} storeId={storeId} currency={store?._id === storeId ? (store.baseCurrency ?? null) : null} />
      </div>
    </>
  );
}
