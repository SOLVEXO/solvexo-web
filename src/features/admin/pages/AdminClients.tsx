import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminUsersStats, useAdminUsersList } from '@/hooks/admin/useAdminUsers';
import type { SellerRow } from '@/api/services/users/adminUsers';
import {
  Table, StatusBadge, MetricCard, AdminPageHeader, SearchInput, FilterDropdown,
} from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate, formatNumber } from '@/components/comman/analytics/format';
import { Users2, Store as StoreIcon, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '—';
}

// ── Clients — the platform owner's directory of businesses/sellers on
// Solvexo. Row click opens the full per-client workspace (AdminClientDetail)
// — Overview, Stores, Customers, Orders, Subscription/Billing, Finance,
// Activity, Moderation all in one place, rather than the admin having to
// jump across Users/Subscriptions/Finance/Moderation to piece one client's
// picture together. This list itself reuses the exact same seller
// list/search/stats already built for the old "Users & Sellers" page —
// only the row action (navigate, not a modal) is different. ────────────────
export function AdminClients() {
  usePageTitle('Clients');
  const navigate = useNavigate();
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminUsersStats();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({ search: search || undefined, status: statusFilter || undefined, page, limit: 10 }),
    [search, statusFilter, page],
  );

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
          <div>
            <p className="text-[12px] font-semibold text-charcoal">{u.name}</p>
            <p className="text-[11px] text-slate">{u.id.slice(-8)}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => <span className="text-[13px] text-graphite">{u.email}</span> },
    {
      key: 'storeCount',
      header: 'Stores',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-graphite">
          <StoreIcon size={13} className="text-slate" />
          {u.storeCount} {u.storeCount === 1 ? 'store' : 'stores'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} size="sm" /> },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(u.createdAt)}</span> },
    {
      key: 'open',
      header: '',
      render: () => <ChevronRight size={15} className="text-slate" />,
    },
  ];

  return (
    <>
      <AdminPageHeader title="Clients" subtitle="Every business on Solvexo — stores, billing, finance, and activity in one workspace." />
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
            <FilterDropdown placeholder="All Statuses" options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
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
              pagination={{ page, total: data?.total ?? 0, perPage: 10, onChange: setPage, label: 'clients' }}
            />
          )}
        </div>
      </div>
    </>
  );
}
