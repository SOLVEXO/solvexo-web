import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, DollarSign, Store, Send, Receipt, FileText } from 'lucide-react';
import { Button, Input, TabBar, type Tab } from '@/components/comman/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminFinanceExport } from '@/hooks/admin/useAdminFinance';
import { AnalyticsFilterBar } from '@/components/comman/analytics/AnalyticsFilterBar';
import {
  CSV_SECTION_OPTIONS,
  DEFAULT_ADMIN_FINANCE_FILTERS,
  GRANULARITY_OPTIONS,
  TAB_TO_CSV_SECTION,
  toAdminFinanceParams,
} from '../components/finance/financeFilters';
import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { FinanceRevenueTab } from './finance/FinanceRevenueTab';
import { FinanceSellersTab } from './finance/FinanceSellersTab';
import { FinancePayoutsTab } from './finance/FinancePayoutsTab';
import { FinanceTransactionsTab } from './finance/FinanceTransactionsTab';
import { FinanceReportsTab } from './finance/FinanceReportsTab';

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
  { id: 'revenue', label: 'Revenue', icon: <DollarSign size={14} /> },
  { id: 'sellers', label: 'Sellers', icon: <Store size={14} /> },
  { id: 'payouts', label: 'Payouts', icon: <Send size={14} /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt size={14} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={14} /> },
];

export function AdminFinance() {
  usePageTitle('Finance');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState(DEFAULT_ADMIN_FINANCE_FILTERS);
  const [csvSection, setCsvSection] = useState(TAB_TO_CSV_SECTION.overview);
  const { exportReport, exporting } = useAdminFinanceExport();

  useEffect(() => { setCsvSection(TAB_TO_CSV_SECTION[activeTab] ?? 'transactions'); }, [activeTab]);

  const params = useMemo(() => toAdminFinanceParams(filters), [filters]);

  return (
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Finance &amp; Payouts</h1>
        <p className="text-[12px] text-slate">Platform revenue, commission, seller balances, and the payout approval queue.</p>
      </div>

      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
        exporting={exporting}
        onExportPdf={() => exportReport({ ...params, format: 'pdf' })}
        onExportCsv={() => exportReport({ ...params, format: 'csv', section: csvSection as never })}
        granularityOptions={GRANULARITY_OPTIONS}
        granularity={filters.granularity}
        onGranularityChange={(v) => setFilters({ ...filters, granularity: v as typeof filters.granularity })}
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
                onChange={(e) => setFilters({ ...filters, storeId: e.target.value.trim() })}
              />
            </div>
            <div className="w-[220px]">
              <Input
                label="Seller ID"
                placeholder="Drill down to one seller…"
                value={filters.sellerId}
                onChange={(e) => setFilters({ ...filters, sellerId: e.target.value.trim() })}
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

      {activeTab === 'overview' && <FinanceOverviewTab params={params} />}
      {activeTab === 'revenue' && <FinanceRevenueTab params={params} />}
      {activeTab === 'sellers' && <FinanceSellersTab />}
      {activeTab === 'payouts' && <FinancePayoutsTab />}
      {activeTab === 'transactions' && <FinanceTransactionsTab params={params} />}
      {activeTab === 'reports' && <FinanceReportsTab params={params} />}
    </div>
  );
}
