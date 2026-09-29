import { useAdminAnalyticsCustomers } from '@/hooks/admin/useAdminAnalytics';
import type { SellerStore } from '@/api/services/users/adminUsers';
import { MetricCard, Table, SkeletonBox } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatCurrency, formatNumber, formatPercent } from '@/components/comman/analytics/format';
import type { TopCustomerRow } from '@/api/services/analytics/adminAnalytics';
import { Users2 } from 'lucide-react';

interface CustomersTabProps {
  sellerId: string;
  stores: SellerStore[];
}

// ── Cross-store customer analytics — the same sellerId-scoped aggregation
// the platform Analytics dashboard already uses, scoped to this one client.
// Blocking/unblocking a specific buyer is a per-store action (a buyer's
// standing is store-specific) — that lives on the Stores tab's "View
// customers" drill-in, not duplicated here. ─────────────────────────────────
export function CustomersTab({ sellerId, stores }: CustomersTabProps) {
  const { data, loading, error, refetch } = useAdminAnalyticsCustomers({ sellerId });

  const columns: TableColumn<TopCustomerRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <p className="text-[12.5px] font-semibold text-charcoal">{c.name}</p>
          <p className="text-[11px] text-slate">{c.email}</p>
        </div>
      ),
    },
    { key: 'totalOrders', header: 'Orders', render: (c) => <span className="text-[13px] text-graphite">{formatNumber(c.totalOrders)}</span> },
    { key: 'lifetimeValue', header: 'Lifetime Value', render: (c) => <span className="text-[13px] font-semibold text-charcoal">{formatCurrency(c.lifetimeValue)}</span> },
  ];

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonBox height={92} rounded="10px" />
        <SkeletonBox height={220} rounded="10px" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Active Customers (30d)" value={formatNumber(data?.activeCustomers ?? 0)} />
        <MetricCard label="Repeat Customer Rate" value={formatPercent(data?.repeatCustomerPercent ?? 0)} />
        <MetricCard label="Avg. Lifetime Value" value={formatCurrency(data?.averageLifetimeValue ?? 0)} />
      </div>

      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <div className="px-5 py-[14px] border-b border-bone">
          <p className="text-[13px] font-semibold text-charcoal">Top Customers by Lifetime Value</p>
        </div>
        <Table
          columns={columns}
          data={data?.topCustomersByLtv ?? []}
          keyExtractor={(c) => c.userId}
          emptyState={{ icon: <Users2 size={28} className="text-slate/50" />, title: 'No customers yet', description: 'Nobody has ordered from this client\'s stores yet.' }}
        />
      </div>

      {stores.length > 1 && (
        <p className="text-[11px] text-slate">
          Figures above are aggregated across all {stores.length} of this client's stores. To block or unblock one buyer at a specific store, open that store from the Stores tab.
        </p>
      )}
    </div>
  );
}
