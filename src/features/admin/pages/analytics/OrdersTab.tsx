import { useState } from 'react';
import { MetricCard, Table, type TableColumn } from '@/components/comman/ui';
import { LineChart, DonutChart } from '@/components/comman/charts';
import { ClipboardList } from 'lucide-react';
import { useAdminAnalyticsOrdersOverTime, useAdminAnalyticsOrderStatusBreakdown, useAdminAnalyticsOrdersList } from '@/hooks/admin/useAdminAnalytics';
import type { BaseAnalyticsParams, OrderListRow } from '@/api/services/analytics/adminAnalytics';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { formatCurrency, formatBucketLabel, formatNumber, formatPercent, formatDate } from '@/components/comman/analytics/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', completed: 'Completed',
  cancelled: 'Cancelled', refunded: 'Refunded', partially_cancelled: 'Partially Cancelled',
  partially_refunded: 'Partially Refunded', partially_shipped: 'Partially Shipped',
};

export function OrdersTab({ params }: { params: BaseAnalyticsParams }) {
  const ordersOverTime = useAdminAnalyticsOrdersOverTime(params);
  const statusBreakdown = useAdminAnalyticsOrderStatusBreakdown(params);

  // Phase 7 — real Mongo-side (skip/limit) pagination; page state here works
  // exactly like the Sellers/Products tabs' tables, the backend is what changed.
  const [page, setPage] = useState(1);
  const ordersList = useAdminAnalyticsOrdersList({ ...params, page, limit: 20 });

  const s = statusBreakdown.data;

  // Each row is one seller's fulfillment of an order (see the backend note
  // surfaced below the table) — orderId can repeat across rows when an
  // order was split across sellers, so the row key includes storeId too.
  const orderColumns: TableColumn<OrderListRow>[] = [
    { key: 'orderId', header: 'Order', render: r => <span className="font-mono text-[11px]">{r.orderId.slice(-8)}</span> },
    { key: 'createdAt', header: 'Date', render: r => formatDate(r.createdAt) },
    { key: 'buyerName', header: 'Buyer', render: r => <div><p className="font-medium">{r.buyerName}</p><p className="text-[11px] text-slate">{r.buyerEmail}</p></div> },
    { key: 'storeName', header: 'Store' },
    { key: 'status', header: 'Status', render: r => STATUS_LABEL[r.status] ?? r.status },
    { key: 'itemCount', header: 'Items', align: 'right' },
    { key: 'grossAmountUSD', header: 'Amount', align: 'right', render: r => r.unconvertible ? 'Not Recorded' : formatCurrency(r.grossAmountUSD ?? 0) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total Orders" value={s ? formatNumber(s.totalOrders) : ''} loading={statusBreakdown.loading} />
        <MetricCard label="Avg. Order Value" value={s ? formatCurrency(s.avgOrderValue) : ''} loading={statusBreakdown.loading} />
        <MetricCard label="Cancellation Rate" value={s ? formatPercent(s.cancellationRatePercent) : ''} loading={statusBreakdown.loading} sub={s ? `${s.cancelledOrders.toLocaleString()} cancelled orders` : undefined} />
        <MetricCard label="Refund Rate" value={s ? formatPercent(s.refundRatePercent) : ''} loading={statusBreakdown.loading} sub={s ? `${s.refundedOrders.toLocaleString()} refunded orders` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {ordersOverTime.loading ? (
            <ChartCardSkeleton />
          ) : ordersOverTime.error ? (
            <AnalyticsErrorState message={ordersOverTime.error} onRetry={ordersOverTime.refetch} />
          ) : (
            <LineChart
              title="Orders Over Time"
              subtitle="Completed, cancelled & refunded, platform-wide"
              data={(ordersOverTime.data?.series ?? []).map(p => ({
                label: formatBucketLabel(p.date, ordersOverTime.data!.granularity),
                orders: p.orderCount,
                cancelled: p.cancelledOrdersCount,
                refunded: p.refundedOrdersCount,
              }))}
              lines={[
                { dataKey: 'orders', label: 'Orders', color: '#D97757' },
                { dataKey: 'cancelled', label: 'Cancelled', color: '#C0392B' },
                { dataKey: 'refunded', label: 'Refunded', color: '#2156A8' },
              ]}
            />
          )}
        </div>

        {statusBreakdown.loading ? (
          <ChartCardSkeleton height={200} />
        ) : statusBreakdown.error ? (
          <AnalyticsErrorState message={statusBreakdown.error} onRetry={statusBreakdown.refetch} />
        ) : s ? (
          <DonutChart
            title="Order Status Breakdown"
            centerLabel="Orders"
            data={Object.entries(s.statusCounts ?? {}).map(([status, count]) => ({
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: count,
            }))}
          />
        ) : null}
      </div>

      <div className="bg-white border border-bone rounded-[10px]">
        <div className="px-5 pt-4 pb-3">
          <p className="text-[14px] font-bold text-charcoal">Orders</p>
          <p className="text-[12px] text-slate">Every order platform-wide, newest first.</p>
        </div>
        {ordersList.error ? (
          <div className="px-5 pb-5"><AnalyticsErrorState message={ordersList.error} onRetry={ordersList.refetch} /></div>
        ) : (
          <Table
            columns={orderColumns}
            data={ordersList.data?.orders ?? []}
            keyExtractor={r => `${r.orderId}-${r.storeId}`}
            loading={ordersList.loading}
            emptyState={{ icon: <ClipboardList size={28} className="text-slate/50" />, title: 'No orders yet' }}
            pagination={{
              page,
              total: ordersList.data?.pagination.total ?? 0,
              perPage: 20,
              onChange: setPage,
              label: 'orders',
            }}
          />
        )}
        {ordersList.data?.note && (
          <p className="text-[11px] text-slate px-5 pb-4">{ordersList.data.note}</p>
        )}
      </div>
    </div>
  );
}
