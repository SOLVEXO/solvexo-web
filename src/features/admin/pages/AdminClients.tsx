import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerPage, PER_PAGE_OPTIONS } from '@/hooks/usePerPage';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useKeepAliveTabs } from '@/hooks/useKeepAliveTabs';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { useAdminUsersStats, useAdminUsersList } from '@/hooks/admin/useAdminUsers';
import type { SellerRow } from '@/api/services/users/adminUsers';
import {
  Table, StatusBadge, MetricCard, AdminPageHeader, SearchInput, FilterDropdown, Button,
} from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate, formatNumber } from '@/components/comman/analytics/format';
import { Users2, Store as StoreIcon, Shield, HeartPulse, Download } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { apiExportClients, type RiskLevel, type VerificationStatus, type YesNo } from '@/api/services/admin/adminSellerTrust';
import { NtnValue, RiskPill, VerificationPill } from './sellerTrust/TrustBits';
import { COUNTRY_OPTIONS, RISK_OPTIONS, VERIFICATION_OPTIONS, countryName } from './sellerTrust/trust.utils';
import { MerchantHealthTab } from './clients/MerchantHealthTab';
import { AdminModeration } from './AdminModeration';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const NTN_OPTIONS = [
  { value: 'yes', label: 'Has NTN / tax no.' },
  { value: 'no', label: 'No NTN / tax no.' },
];

const TABS: Tab[] = [
  { id: 'clients', label: 'Clients', icon: <Users2 size={14} /> },
  { id: 'health', label: 'Health', icon: <HeartPulse size={14} /> },
  { id: 'moderation', label: 'Moderation', icon: <Shield size={14} /> },
];

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '—';
}

// ── Clients Manage — one page for everything about the businesses/sellers
// on Solvexo: the directory itself (this tab), and content moderation
// against them (the Moderation tab, the same AdminModeration page reused
// with `embedded`, not duplicated — see that file's own prop comment).
// Row click on a client opens the full per-client workspace
// (AdminClientDetail) — Overview, Stores, Customers, Orders,
// Subscription/Billing, Finance, Activity, Moderation all in one place. ────
export function AdminClients() {
  usePageTitle('Clients Manage');
  const navigate = useNavigate();
  const { activeTab, setActiveTab, isVisited, paneClassName } = useKeepAliveTabs<'clients' | 'health' | 'moderation'>('clients');

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminUsersStats();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [country, setCountry] = useState('');
  const [ntn, setNtn] = useState('');
  const [verification, setVerification] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = usePerPage('admin-clients');
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const filters = useMemo(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
    country: country || undefined,
    ntn: (ntn || undefined) as YesNo | undefined,
    verification: (verification || undefined) as VerificationStatus | undefined,
    risk: (risk || undefined) as RiskLevel | undefined,
  }), [search, statusFilter, country, ntn, verification, risk]);
  const query = useMemo(() => ({ ...filters, page, limit: perPage }), [filters, page, perPage]);
  const setFilter = (set: (v: string) => void) => (v: string) => { set(v); setPage(1); };

  async function exportCsv() {
    setExporting(true);
    try { await apiExportClients(filters); } catch (e) { toast.error(e instanceof Error ? e.message : 'Export failed.'); } finally { setExporting(false); }
  }

  const { data, loading, error, refetch } = useAdminUsersList(query);

  const columns: TableColumn<SellerRow>[] = [
    {
      key: 'name',
      header: 'Client',
      render: (u) => (
        <div className="flex items-center gap-[10px]">
          <div className="w-7 h-7 rounded-full bg-brand-pale-orange text-brand-deep-orange text-[9px] font-bold flex items-center justify-center shrink-0">
            {initialsOf(u.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-charcoal flex items-center gap-1.5">
              {u.name}
              {u.status !== 'active' && <StatusBadge status={u.status} size="sm" />}
            </p>
            <p className="text-[11px] text-slate truncate max-w-[220px]">{u.email}</p>
            <p className="text-[11px] text-slate inline-flex items-center gap-1 whitespace-nowrap">
              <StoreIcon size={11} />{u.storeCount} {u.storeCount === 1 ? 'store' : 'stores'} · joined {formatDate(u.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-[12.5px] text-graphite whitespace-nowrap">{u.phone || '—'}</span> },
    { key: 'country', header: 'Country', render: (u) => <span className="text-[12.5px] text-graphite whitespace-nowrap">{countryName(u.country)}</span> },
    { key: 'ntn', header: 'NTN', render: (u) => (u.storeCount === 0 ? <span className="text-[12px] text-slate">—</span> : <NtnValue hasNtn={u.hasNtn} ntn={u.ntn} />) },
    { key: 'verification', header: 'Verification', render: (u) => (u.storeCount === 0 ? <span className="text-[12px] text-slate">No store</span> : <VerificationPill status={u.verificationStatus} dueAt={u.dueAt} />) },
    { key: 'risk', header: 'Risk', render: (u) => <RiskPill level={u.riskLevel} /> },
    { key: 'sells', header: 'Sells', render: (u) => <span className="text-[12.5px] text-graphite">{u.sells || '—'}</span> },
  ];

  return (
    <>
      <AdminPageHeader title="Clients Manage" subtitle="Every business on Solvexo — stores, billing, finance, activity, and moderation in one place." />
      <TabBar tabs={TABS} active={activeTab} onChange={(t) => setActiveTab(t as 'clients' | 'health' | 'moderation')} className="px-4 sm:px-7 mt-5" />

      {isVisited('clients') && (
        <div className={paneClassName('clients')}>
          <div className="px-4 sm:px-7 pt-6 pb-8 flex flex-col gap-5">
            {statsError ? (
              <AnalyticsErrorState message={statsError} onRetry={refetchStats} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {statsLoading && !stats ? (
                  Array.from({ length: 3 }).map((_, i) => <MetricCard key={i} label="" value="" loading />)
                ) : stats ? (
                  <>
                    <MetricCard label="Total Buyer Accounts" value={formatNumber(stats.totalBuyers)} />
                    <MetricCard label="Active Clients" value={formatNumber(stats.activeSellerAccounts)} />
                    <MetricCard label="Suspended" value={formatNumber(stats.suspended)} sub="Under review" />
                  </>
                ) : null}
              </div>
            )}

            <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
              <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
                <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" className="flex-1 max-w-[280px]" />
                <FilterDropdown placeholder="All Statuses" options={STATUS_OPTIONS} value={statusFilter} onChange={setFilter(setStatusFilter)} />
                <FilterDropdown placeholder="All countries" options={COUNTRY_OPTIONS} value={country} onChange={setFilter(setCountry)} />
                <FilterDropdown placeholder="NTN: any" options={NTN_OPTIONS} value={ntn} onChange={setFilter(setNtn)} />
                <FilterDropdown placeholder="Verification: any" options={VERIFICATION_OPTIONS} value={verification} onChange={setFilter(setVerification)} />
                <FilterDropdown placeholder="Risk: any" options={RISK_OPTIONS} value={risk} onChange={setFilter(setRisk)} />
                <Button size="sm" variant="outline" icon={<Download size={13} />} loading={exporting} onClick={exportCsv} className="ml-auto">Export CSV</Button>
              </div>

              {error ? (
                <div className="p-5"><AnalyticsErrorState message={error} onRetry={refetch} /></div>
              ) : (
                <Table
                  columns={columns}
                  data={data?.items ?? []}
                  keyExtractor={(u) => u.id}
                  loading={loading}
                  onRowClick={(u) => navigate(`/admin/clients/${u.id}`)}
                  emptyState={{ icon: <Users2 size={28} className="text-slate/50" />, title: 'No clients match your filters', description: 'Try adjusting your search or clearing filters.' }}
                  pagination={{ page, total: data?.total ?? 0, perPage, onChange: setPage, label: 'clients', perPageOptions: PER_PAGE_OPTIONS, onPerPageChange: n => { setPerPage(n); setPage(1); } }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {isVisited('health') && (
        <div className={paneClassName('health')}>
          <MerchantHealthTab />
        </div>
      )}

      {isVisited('moderation') && (
        <div className={paneClassName('moderation')}>
          <div className="px-4 sm:px-7 pt-6 pb-8">
            <AdminModeration embedded />
          </div>
        </div>
      )}
    </>
  );
}
