import { useState } from 'react';
import { useAdminAnalyticsOrdersList } from '@/hooks/admin/useAdminAnalytics';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { apiAdminGetOrderDetail } from '@/api/services/product';
import { Table, StatusBadge, Modal, Button, SkeletonBox } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatCurrency, formatDate } from '@/components/comman/analytics/format';
import type { OrderListRow } from '@/api/services/analytics/adminAnalytics';
import { ShoppingBag } from 'lucide-react';

interface OrdersTabProps {
  sellerId: string;
}

// ── Order detail — VIEW ONLY, deliberately. Solvexo stores work like
// independent Shopify stores, not a curated marketplace the platform
// intermediates — a seller's own orders/customers are their business, not
// something admin cancels/refunds on their behalf, however well-intentioned.
// Cancel/refund actions were built and then removed for exactly this
// reason — real Shopify-parity means admin gets read visibility for
// support/diagnostics, never write access into a seller's own order data.
function OrderDetailModal({ order, onClose }: { order: OrderListRow; onClose: () => void }) {
  const { data, loading, error, refetch } = useAnalyticsQuery(
    (p: { storeId: string; orderId: string }) => apiAdminGetOrderDetail(p.storeId, p.orderId),
    { storeId: order.storeId, orderId: order.orderId },
  );
  // The API converts non-USD orders using the rate saved on the order; null = no rate on file.
  const usd = (n: number | null | undefined) => (n == null ? '—' : formatCurrency(n));

  return (
    <Modal
      mobileSheet
      title={`Order #${order.orderId.slice(-8)} — ${order.storeName}`}
      onClose={onClose}
      width={640}
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {error ? (
        <AnalyticsErrorState message={error} onRetry={refetch} />
      ) : loading || !data ? (
        <SkeletonBox height={220} rounded="10px" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{data.buyer.name}</p>
              <p className="text-[11.5px] text-slate">{data.buyer.email}{data.buyer.phone ? ` · ${data.buyer.phone}` : ''}</p>
            </div>
            <StatusBadge status={data.sellerOrder.status} size="sm" />
          </div>

          {data.shippingAddress && (
            <div className="bg-cream rounded-lg px-3 py-2.5">
              <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">Shipping Address</p>
              <p className="text-[12.5px] text-charcoal">
                {data.shippingAddress.recipientName} — {data.shippingAddress.addressLine1}
                {data.shippingAddress.addressLine2 ? `, ${data.shippingAddress.addressLine2}` : ''}, {data.shippingAddress.city}, {data.shippingAddress.state} {data.shippingAddress.zipCode}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {data.sellerOrder.items.map((item) => (
              <div key={item._id} className="flex items-center gap-3 border border-bone rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-charcoal truncate">{item.name}</p>
                  <p className="text-[11px] text-slate">Qty {item.quantity} · {usd(item.price)} each{item.refundedAmount > 0 ? ` · ${usd(item.refundedAmount)} refunded` : ''}</p>
                </div>
                <span className="text-[12.5px] font-semibold text-charcoal">{usd(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[13px] pt-2 border-t border-bone">
            <span className="text-slate">Subtotal (USD)</span>
            <span className="font-semibold text-charcoal">{usd(data.sellerOrder.subtotal)}</span>
          </div>
          <p className="text-[11px] text-slate">Placed {formatDate(data.createdAt)} · {data.paymentType}{data.isPaid ? ' · Paid' : ' · Not paid yet'}</p>
        </div>
      )}
    </Modal>
  );
}

export function OrdersTab({ sellerId }: OrdersTabProps) {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAdminAnalyticsOrdersList({ sellerId, page, limit: 10 });
  const [selected, setSelected] = useState<OrderListRow | null>(null);

  const columns: TableColumn<OrderListRow>[] = [
    {
      key: 'orderId',
      header: 'Order',
      render: (o) => <span className="text-[12.5px] font-semibold text-charcoal">#{o.orderId.slice(-8)}</span>,
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      render: (o) => (
        <div>
          <p className="text-[12.5px] text-charcoal">{o.buyerName}</p>
          <p className="text-[11px] text-slate">{o.buyerEmail}</p>
        </div>
      ),
    },
    { key: 'storeName', header: 'Store', render: (o) => <span className="text-[13px] text-graphite">{o.storeName}</span> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} size="sm" /> },
    {
      key: 'grossAmountUSD',
      header: 'Amount',
      render: (o) => <span className="text-[13px] font-semibold text-charcoal">{o.unconvertible || o.grossAmountUSD == null ? '—' : formatCurrency(o.grossAmountUSD)}</span>,
    },
    { key: 'createdAt', header: 'Date', render: (o) => <span className="text-[13px] text-slate whitespace-nowrap">{formatDate(o.createdAt)}</span> },
  ];

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
        <Table
          columns={columns}
          data={data?.orders ?? []}
          keyExtractor={(o) => o.orderId}
          loading={loading}
          onRowClick={(o) => setSelected(o)}
          emptyState={{ icon: <ShoppingBag size={28} className="text-slate/50" />, title: 'No orders yet', description: 'This client hasn\'t received any orders yet.' }}
          pagination={{ page, total: data?.pagination.total ?? 0, perPage: 10, onChange: setPage, label: 'orders' }}
        />
      </div>

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
