import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, DollarSign, Package, Users, Globe2 } from 'lucide-react';
import { TabBar, type Tab } from '@/components/comman/ui';
import { AnalyticsFilterBar } from '@/components/comman/analytics/AnalyticsFilterBar';
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
  storeId: string;
}

/**
 * The full analytics dashboard for one store — shared by both `StoreAnalytics`
 * (routed at `/seller/store/:storeId/analytics`, storeId from the URL) and
 * `SellerAnalytics` (routed at `/seller/analytics`, storeId from a store picker).
 * Mirrors the `AdminAnalytics` page structure 1:1 (filter bar + TabBar + tab panels)
 * scoped down to the 5 tabs the seller-side backend module actually supports.
 */
export function SellerAnalyticsView({ storeId }: SellerAnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState(DEFAULT_SELLER_ANALYTICS_FILTERS);
  const [csvSection, setCsvSection] = useState(TAB_TO_CSV_SECTION.overview);
  const { exportReport, exporting } = useSellerAnalyticsExport();

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
      />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'  && <SellerOverviewTab params={params} compareToPreviousPeriod={filters.compareToPreviousPeriod} />}
      {activeTab === 'revenue'   && <SellerRevenueTab params={params} />}
      {activeTab === 'products'  && <SellerProductsTab params={params} />}
      {activeTab === 'customers' && <SellerCustomersTab params={params} />}
      {activeTab === 'traffic'   && <SellerTrafficPaymentsTab params={params} />}
    </div>
  );
}
