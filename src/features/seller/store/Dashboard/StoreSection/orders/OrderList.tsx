import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, AlertCircle, RefreshCw,
  DollarSign, Clock, TrendingUp, CheckCheck, Truck,
} from 'lucide-react';
import { apiMarkOrderPaid, apiUpdateOrderStatus } from '@/api/services/orders';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Table,      type TableColumn,
  MetricCard,
  Badge,      StatusBadge,
  Card,
  Avatar,
  SearchInput,
  ActionMenu,
  Modal,
  Field,
  Input,
  Button,
} from '@/components/comman/ui';
import {
  apiGetSellerOrders,
  apiExportOrdersCsv,
  type SellerOrder,
  type SellerOrderStats,
} from '@/api/services/product';
import { usePageTitle } from '@/hooks/usePageTitle';
import { currencySymbol } from '@/utils/currency';

// ── Customer cell ──────────────────────────────────────────────────────────────
function CustomerCell({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} size={30} />
      <div>
        <p className="text-[13px] font-medium text-charcoal mb-[1px]">{name}</p>
        <p className="text-[11px] text-slate">{email}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function StoreOrderList() {
  usePageTitle('Orders');
  const navigate = useNavigate();
  const { storeId, store } = useStoreWorkspace();

  const [orders,      setOrders]      = useState<SellerOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats,       setStats]       = useState<SellerOrderStats | null>(null);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusF,     setStatusF]     = useState('');
  const [typeF,       setTypeF]       = useState('');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [markingPaidId,    setMarkingPaidId]    = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Shipping an order requires a tracking number server-side — this modal is what
  // actually collects it before the status update is sent, instead of firing the
  // update immediately and letting it fail against that requirement.
  const [shippingOrder, setShippingOrder] = useState<SellerOrder | null>(null);
  const [trackingForm, setTrackingForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });
  const [trackingErrors, setTrackingErrors] = useState<{ carrier?: string; trackingNumber?: string }>({});
  const [submittingTracking, setSubmittingTracking] = useState(false);

  const LIMIT = 10;
  // No server-side order search endpoint exists — when searching, fetch a
  // much larger page instead of the normal small one so the search covers
  // (up to) the whole order list rather than silently only ever matching
  // whatever 10 rows happened to already be on screen (same pattern as
  // StoreProductList's SEARCH_LIMIT).
  const SEARCH_LIMIT = 1000;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    const isSearching = debouncedSearch.trim().length > 0;
    const [fetchPage, fetchLimit] = isSearching ? [1, SEARCH_LIMIT] : [page, LIMIT];

    apiGetSellerOrders(storeId, fetchPage, fetchLimit)
      .then(res => {
        if (cancelled) return;
        setOrders(res.data.orders ?? []);
        setStats(res.data.stats);
        setTotalOrders(res.data.pagination.totalOrders);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [storeId, page, refreshKey, debouncedSearch]);

  const handlePageChange = (p: number) => {
    setLoading(true);
    setError('');
    setSearch('');
    setPage(p);
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setRefreshKey(k => k + 1);
  };

  const [exporting, setExporting] = useState(false);
  const handleExportCsv = () => {
    setExporting(true);
    setError('');
    apiExportOrdersCsv(storeId, {
      status: statusF || undefined,
      type: typeF || undefined,
    })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to export orders.'))
      .finally(() => setExporting(false));
  };

  const handleSubmitTracking = () => {
    if (!shippingOrder) return;
    const carrier = trackingForm.carrier.trim();
    const trackingNumber = trackingForm.trackingNumber.trim();
    const errors: { carrier?: string; trackingNumber?: string } = {};
    if (!carrier) errors.carrier = 'Carrier is required.';
    if (!trackingNumber) errors.trackingNumber = 'Tracking number is required.';
    if (Object.keys(errors).length) {
      setTrackingErrors(errors);
      return;
    }

    const orderId = shippingOrder.orderId;
    setSubmittingTracking(true);
    apiUpdateOrderStatus({
      orderId,
      storeId,
      status: 'shipped',
      tracking: {
        carrier,
        trackingNumber,
        trackingUrl: trackingForm.trackingUrl.trim(),
      },
    })
      .then(() => {
        setOrders(prev =>
          prev.map(x => x.orderId === orderId ? { ...x, status: 'shipped' } : x)
        );
        setShippingOrder(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to mark order as shipped.');
        setShippingOrder(null);
      })
      .finally(() => setSubmittingTracking(false));
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    if (q &&
      !o.orderNumber.toLowerCase().includes(q) &&
      !o.customer.name.toLowerCase().includes(q) &&
      !o.product.toLowerCase().includes(q)
    ) return false;
    if (statusF && o.status !== statusF) return false;
    if (typeF   && o.type   !== typeF)   return false;
    return true;
  });

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: TableColumn<SellerOrder>[] = [
    {
      key: 'no', header: '#', width: '48px',
      render: (_, i) => (
        <span className="text-[12px] text-slate font-medium">
          {(page - 1) * LIMIT + i + 1}
        </span>
      ),
    },
    {
      key: 'orderNumber', header: 'Order',
      render: o => (
        <span className="text-[12px] font-bold text-brand-deep-orange font-mono">
          {o.orderNumber}
        </span>
      ),
    },
    {
      key: 'customer', header: 'Customer',
      render: o => <CustomerCell name={o.customer.name} email={o.customer.email} />,
    },
    {
      key: 'product', header: 'Product',
      render: o => (
        <span className="text-[13px] text-carbon max-w-[180px] truncate block">{o.product}</span>
      ),
    },
    {
      key: 'type', header: 'Type',
      render: o => (
        <Badge color={o.type === 'digital' ? 'blue' : 'orange'}>
          {o.type === 'digital' ? (o.productType === 'educational' ? 'Educational' : 'Digital') : 'Physical'}
        </Badge>
      ),
    },
    {
      key: 'date', header: 'Date',
      render: o => (
        <span className="text-[12px] text-slate whitespace-nowrap">
          {new Date(o.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'amount', header: 'Amount', align: 'right',
      render: o => (
        <span className="text-[13px] font-bold text-charcoal whitespace-nowrap">
          {currencySymbol(store?.baseCurrency)}{o.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentType', header: 'Payment',
      render: o => (
        <div className="flex flex-col gap-[2px]">
          <span className="text-[12px] text-slate capitalize">{o.paymentType.replace(/_/g, ' ')}</span>
          {o.isPaid
            ? <span className="text-[10px] font-semibold text-success">Paid</span>
            : <span className="text-[10px] font-semibold text-[#b36200]">Unpaid</span>
          }
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: o => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions', header: '', align: 'center', width: '60px',
      render: o => {
        const busy = markingPaidId === o.orderId || updatingStatusId === o.orderId;

        const changeStatus = (status: 'processing' | 'completed' | 'cancelled') => {
          if (busy) return;
          setUpdatingStatusId(o.orderId);
          apiUpdateOrderStatus({ orderId: o.orderId, storeId, status })
            .then(() => {
              setOrders(prev =>
                prev.map(x => x.orderId === o.orderId ? { ...x, status } : x)
              );
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : 'Failed to update status.');
            })
            .finally(() => setUpdatingStatusId(null));
        };

        return (
          <ActionMenu
            align="right"
            items={[
              ...(!o.isPaid ? [{
                label: markingPaidId === o.orderId ? 'Marking…' : 'Mark as Paid',
                icon: <CheckCheck size={13} />,
                onClick: () => {
                  if (busy) return;
                  setMarkingPaidId(o.orderId);
                  apiMarkOrderPaid(o.orderId)
                    .then(() => setOrders(prev =>
                      prev.map(x => x.orderId === o.orderId ? { ...x, isPaid: true } : x)
                    ))
                    .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to mark as paid.'))
                    .finally(() => setMarkingPaidId(null));
                },
              }] : []),
              ...(o.status === 'pending' ? [{
                label: updatingStatusId === o.orderId ? 'Updating…' : 'Mark Processing',
                icon: <RefreshCw size={13} />,
                onClick: () => changeStatus('processing'),
              }] : []),
              ...(o.status !== 'completed' && o.status !== 'cancelled' ? [{
                label: 'Mark Shipped',
                icon: <Truck size={13} />,
                onClick: () => {
                  if (busy) return;
                  setTrackingForm({ carrier: '', trackingNumber: '', trackingUrl: '' });
                  setTrackingErrors({});
                  setShippingOrder(o);
                },
              }, {
                label: updatingStatusId === o.orderId ? 'Updating…' : 'Mark Completed',
                icon: <CheckCheck size={13} />,
                onClick: () => changeStatus('completed'),
              }] : []),
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Orders"
        subtitle={loading ? 'Loading…' : `${totalOrders} order${totalOrders !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-white text-graphite border border-bone rounded-[9px] px-4 py-[9px] text-[13px] font-medium cursor-pointer hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      <div className="px-4 lg:px-7 py-5 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={<ShoppingCart size={16} />}
            loading={loading && !stats}
          />
          <MetricCard
            label="Revenue"
            value={stats ? `${currencySymbol(store?.baseCurrency)}${stats.revenue.toLocaleString()}` : 0}
            icon={<DollarSign size={16} />}
            loading={loading && !stats}
          />
          <MetricCard
            label="Pending"
            value={stats?.pending ?? 0}
            icon={<Clock size={16} />}
            loading={loading && !stats}
          />
          <MetricCard
            label="Avg. Order"
            value={stats ? `${currencySymbol(store?.baseCurrency)}${stats.avgOrder.toLocaleString()}` : 0}
            icon={<TrendingUp size={16} />}
            loading={loading && !stats}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{error}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <Card padding="none">
            <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col gap-2.5">
              <p className="text-[14px] font-bold text-charcoal shrink-0">All Orders</p>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search orders…"
                className="w-full sm:w-[200px] sm:ml-auto"
              />
              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-end">
                <select
                  value={statusF || 'All Status'}
                  onChange={e => setStatusF(e.target.value === 'All Status' ? '' : e.target.value)}
                  className="text-[13px] px-3 py-2 sm:py-[7px] rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer shrink-0"
                >
                  {['All Status', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map(o => (
                    <option key={o} value={o}>{o === 'All Status' ? 'All Status' : o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={typeF || 'All Types'}
                  onChange={e => setTypeF(e.target.value === 'All Types' ? '' : e.target.value)}
                  className="text-[13px] px-3 py-2 sm:py-[7px] rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer shrink-0"
                >
                  {['All Types', 'digital', 'physical'].map(o => (
                    <option key={o} value={o}>{o === 'All Types' ? 'All Types' : o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setSearch(''); setStatusF(''); setTypeF(''); }}
                  className="text-[12px] text-slate border border-bone rounded-[6px] px-3 py-2 sm:py-[7px] bg-white cursor-pointer hover:bg-bone shrink-0"
                >
                  Clear
                </button>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-2 sm:py-[7px] hover:bg-bone shrink-0"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </div>

            <Table
              columns={columns}
              data={filtered}
              keyExtractor={o => o.orderId}
              onRowClick={o => navigate(`/store/${storeId}/orders/detail/${o.orderId}`)}
              loading={loading}
              emptyState={{
                icon: <ShoppingCart size={30} className="text-brand-orange opacity-55" />,
                title: search || statusF || typeF ? 'No orders match your filters' : 'No orders yet',
                description:
                  search || statusF || typeF
                    ? 'Try adjusting your search or filters.'
                    : 'Orders from your store will appear here once customers start purchasing.',
              }}
              pagination={{
                page,
                total:    totalOrders,
                perPage:  LIMIT,
                onChange: handlePageChange,
                label:    'orders',
              }}
            />
          </Card>
        )}

      </div>

      {shippingOrder && (
        <Modal
          title={`Mark ${shippingOrder.orderNumber} as Shipped`}
          onClose={() => { if (!submittingTracking) setShippingOrder(null); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setShippingOrder(null)} disabled={submittingTracking}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitTracking} loading={submittingTracking}>
                Mark Shipped
              </Button>
            </>
          }
        >
          <p className="text-[12.5px] text-slate mb-4">
            Add the shipment's tracking details so the customer can follow their delivery.
          </p>
          <Field label="Carrier" required error={trackingErrors.carrier}>
            <Input
              placeholder="e.g. DHL, FedEx, Local Courier"
              value={trackingForm.carrier}
              onChange={e => setTrackingForm(f => ({ ...f, carrier: e.target.value }))}
              disabled={submittingTracking}
            />
          </Field>
          <Field label="Tracking Number" required error={trackingErrors.trackingNumber}>
            <Input
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingForm.trackingNumber}
              onChange={e => setTrackingForm(f => ({ ...f, trackingNumber: e.target.value }))}
              disabled={submittingTracking}
            />
          </Field>
          <Field label="Tracking Link" hint="Optional — lets the customer open the carrier's tracking page directly.">
            <Input
              type="url"
              placeholder="https://…"
              value={trackingForm.trackingUrl}
              onChange={e => setTrackingForm(f => ({ ...f, trackingUrl: e.target.value }))}
              disabled={submittingTracking}
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
