import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, DollarSign, Package, Users, Globe2 } from 'lucide-react';
import { TabBar, type Tab } from '@/components/comman/ui';
import { AnalyticsFilterBar } from '@/components/comman/analytics/AnalyticsFilterBar';
import { useActiveStore } from '@/contexts/ActiveStoreContext';
import { useSellerAnalyticsExport } from '@/hooks/seller/useSellerAnalytics';
import type { SellerExportSection } from '@/api/services/analytics/analytics';
import {
  CSV_SECTION_OPTIONS,
  DEFAULT_SELLER_ANALYTICS_FILTERS,
  TAB_TO_CSV_SECTION,
  toSellerAnalyticsParams,
} from './sellerAnalyticsFilters';
import { SellerOverviewTab } from './tabs/SellerOverviewTab';
import { SellerRevenueTab } from './tabs/SellerRevenueTab';
import { SellerProductsTab } from './tabs/SellerProductsTab';
import { SellerCustomersTab } from './tabs/SellerCustomersTab';
import { SellerTrafficPaymentsTab } from './tabs/SellerTrafficPaymentsTab';

const TABS: Tab[] = [
  { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={14} /> },
  { id: 'revenue',   label: 'Revenue',   icon: <DollarSign size={14} /> },
  { id: 'products',  label: 'Products',  icon: <Package size={14} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={14} /> },
  { id: 'traffic',   label: 'Traffic & Payments', icon: <Globe2 size={14} /> },
];

interface SellerAnalyticsViewProps {
  /** `null` means "every store the seller owns" — the cross-store view. */
  storeId: string | null;
}

/**
 * The full analytics dashboard for one store, or for every store the seller owns
 * — shared by `StoreAnalytics` (routed at `/seller/store/:storeId/analytics`,
 * always one store from the URL) and `SellerAnalytics` (routed at
 * `/seller/analytics`, storeId from a store picker that also offers "All Stores").
 * Mirrors the `AdminAnalytics` page structure 1:1 (filter bar + TabBar + tab panels)
 * scoped down to the 5 tabs the seller-side backend module actually supports.
 * Export (PDF/CSV) stays single-store only — hidden when `storeId` is null.
 */
export function SellerAnalyticsView({ storeId }: SellerAnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState(DEFAULT_SELLER_ANALYTICS_FILTERS);
  const [csvSection, setCsvSection] = useState(TAB_TO_CSV_SECTION.overview);
  const { exportReport, exporting } = useSellerAnalyticsExport();
  // `null` (cross-store "All Stores" view) means no single currency can be
  // shown correctly — tabs fall back to a plain "$" in that case, same as
  // before this fix, since the underlying analytics aggregation itself
  // doesn't yet convert/group multi-store amounts by currency (see
  // analytics.service.ts — a real backend gap, not something this display
  // fix alone can safely resolve without changing what revenue number a
  // multi-currency seller is shown).
  const { activeStore } = useActiveStore();
  const currency = storeId ? activeStore?.baseCurrency : null;

  useEffect(() => { setCsvSection(TAB_TO_CSV_SECTION[activeTab] ?? 'revenue'); }, [activeTab]);

  const params = useMemo(() => toSellerAnalyticsParams(filters, storeId), [filters, storeId]);

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
        exporting={exporting}
        onExportPdf={() => exportReport({ ...params, format: 'pdf' })}
        onExportCsv={() => exportReport({ ...params, format: 'csv', section: csvSection as SellerExportSection })}
        csvSections={CSV_SECTION_OPTIONS}
        csvSection={csvSection}
        onCsvSectionChange={setCsvSection}
        showExport={!!storeId}
      />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'  && <SellerOverviewTab params={params} compareToPreviousPeriod={filters.compareToPreviousPeriod} currency={currency} />}
      {activeTab === 'revenue'   && <SellerRevenueTab params={params} currency={currency} />}
      {activeTab === 'products'  && <SellerProductsTab params={params} currency={currency} />}
      {activeTab === 'customers' && <SellerCustomersTab params={params} currency={currency} />}
      {activeTab === 'traffic'   && <SellerTrafficPaymentsTab params={params} currency={currency} />}
    </div>
  );
}
