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
        <SellerAnalyticsView storeId={storeId} currency={store?.baseCurrency ?? null} />
      </div>
    </>
  );
}
