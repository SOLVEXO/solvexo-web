import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, DollarSign, Store, Users, Package, ShoppingCart, CreditCard, TrendingUp,
} from 'lucide-react';
import { Button, Input, TabBar, type Tab } from '@/components/comman/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminAnalyticsExport } from '@/hooks/admin/useAdminAnalytics';
import { AnalyticsFilterBar } from '@/components/comman/analytics/AnalyticsFilterBar';
import type { ExportSection } from '@/api/services/analytics/adminAnalytics';
import {
  CSV_SECTION_OPTIONS,
  DEFAULT_ANALYTICS_FILTERS,
  GRANULARITY_OPTIONS,
  TAB_TO_CSV_SECTION,
  toBaseAnalyticsParams,
} from '../components/analytics/analyticsFilters';
import { OverviewTab } from './analytics/OverviewTab';
import { RevenueTab } from './analytics/RevenueTab';
import { SellersTab } from './analytics/SellersTab';
import { CustomersTab } from './analytics/CustomersTab';
import { ProductsTab } from './analytics/ProductsTab';
import { OrdersTab } from './analytics/OrdersTab';
import { PaymentsTab } from './analytics/PaymentsTab';
import { PlatformTab } from './analytics/PlatformTab';

const TABS: Tab[] = [
  { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={14} /> },
  { id: 'revenue',   label: 'Revenue',   icon: <DollarSign size={14} /> },
  { id: 'sellers',   label: 'Sellers',   icon: <Store size={14} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={14} /> },
  { id: 'products',  label: 'Products',  icon: <Package size={14} /> },
  { id: 'orders',    label: 'Orders',    icon: <ShoppingCart size={14} /> },
  { id: 'payments',  label: 'Payments',  icon: <CreditCard size={14} /> },
  { id: 'platform',  label: 'Platform',  icon: <TrendingUp size={14} /> },
];

export function AdminAnalytics() {
  usePageTitle('Analytics');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const [csvSection, setCsvSection] = useState(TAB_TO_CSV_SECTION.overview);
  const { exportReport, exporting } = useAdminAnalyticsExport();

  // Re-point the CSV section at whatever's most relevant to the tab the user just opened —
  // but only as a default; `setCsvSection` below still lets them override it explicitly.
  useEffect(() => { setCsvSection(TAB_TO_CSV_SECTION[activeTab] ?? 'revenue'); }, [activeTab]);

  const params = useMemo(() => toBaseAnalyticsParams(filters), [filters]);

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Platform Analytics</h1>
        <p className="text-[12px] text-slate">Marketplace-wide revenue, sellers, customers, products, orders, payments & growth.</p>
      </div>

      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
        exporting={exporting}
        onExportPdf={() => exportReport({ ...params, format: 'pdf' })}
        onExportCsv={() => exportReport({ ...params, format: 'csv', section: csvSection as ExportSection })}
        granularityOptions={GRANULARITY_OPTIONS}
        granularity={filters.granularity}
        onGranularityChange={v => setFilters({ ...filters, granularity: v as typeof filters.granularity })}
        csvSections={CSV_SECTION_OPTIONS}
        csvSection={csvSection}
        onCsvSectionChange={setCsvSection}
        advanced={
          <>
            <div className="w-[220px]">
              <Input
                label="Store ID"
                placeholder="Drill down to one store…"
                value={filters.storeId}
                onChange={e => setFilters({ ...filters, storeId: e.target.value.trim() })}
              />
            </div>
            <div className="w-[220px]">
              <Input
                label="Seller ID"
                placeholder="Drill down to one seller…"
                value={filters.sellerId}
                onChange={e => setFilters({ ...filters, sellerId: e.target.value.trim() })}
              />
            </div>
            {(filters.storeId || filters.sellerId) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, storeId: '', sellerId: '' })}>
                Clear
              </Button>
            )}
          </>
        }
      />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'  && <OverviewTab params={params} compareToPreviousPeriod={filters.compareToPreviousPeriod} />}
      {activeTab === 'revenue'   && <RevenueTab params={params} />}
      {activeTab === 'sellers'   && <SellersTab params={params} />}
      {activeTab === 'customers' && <CustomersTab params={params} />}
      {activeTab === 'products'  && <ProductsTab params={params} />}
      {activeTab === 'orders'    && <OrdersTab params={params} />}
      {activeTab === 'payments'  && <PaymentsTab params={params} />}
      {activeTab === 'platform'  && <PlatformTab params={params} />}
    </div>
  );
}
