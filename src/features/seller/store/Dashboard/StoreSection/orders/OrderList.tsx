import { useState, useEffect } from 'react';
import {
  ShoppingCart, AlertCircle, RefreshCw,
  DollarSign, Clock, TrendingUp, Eye, CheckCheck, Truck,
} from 'lucide-react';
import { apiMarkOrderPaid, apiUpdateOrderStatus } from '@/api/commerce/orders';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  Table,      type TableColumn,
  MetricCard,
  Badge,      StatusBadge,
  EmptyState,
  Card,
  Avatar,
  SearchInput,
  SkeletonBox,
  ActionMenu,
} from '@/components/comman/ui';
import {
  apiGetSellerOrders,
  type SellerOrder,
  type SellerOrderStats,
} from '@/api/commerce/product';
import { usePageTitle } from '@/hooks/usePageTitle';

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
  const { storeId } = useStoreWorkspace();

  const [orders,      setOrders]      = useState<SellerOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats,       setStats]       = useState<SellerOrderStats | null>(null);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState('');
  const [typeF,       setTypeF]       = useState('');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [markingPaidId,    setMarkingPaidId]    = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const LIMIT = 10;

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    apiGetSellerOrders(storeId, page, LIMIT)
      .then(res => {
        if (cancelled) return;
        setOrders(res.data.orders);
        setStats(res.data.stats);
        setTotalOrders(res.data.pagination.totalOrders);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [storeId, page, refreshKey]);

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
          {o.type === 'digital' ? 'Digital' : 'Physical'}
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
          Rs {o.amount.toLocaleString()}
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
            : <span className="text-[10px] font-semibold text-[#B36200]">Unpaid</span>
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

        const changeStatus = (status: 'processing' | 'shipped' | 'completed' | 'cancelled') => {
          if (busy) return;
          setUpdatingStatusId(o.orderId);
          apiUpdateOrderStatus({ orderId: o.orderId, storeId, status })
            .then(() => {
              setOrders(prev =>
                prev.map(x => x.orderId === o.orderId ? { ...x, status } : x)
              );
            })
            .catch((err: unknown) => {
              alert(err instanceof Error ? err.message : 'Failed to update status.');
            })
            .finally(() => setUpdatingStatusId(null));
        };

        return (
          <ActionMenu
            align="right"
            items={[
              { label: 'View Order', onClick: () => {}, icon: <Eye size={13} /> },
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
                    .catch((err: unknown) => alert(err instanceof Error ? err.message : 'Failed to mark as paid.'))
                    .finally(() => setMarkingPaidId(null));
                },
              }] : []),
              ...(o.status === 'pending' ? [{
                label: updatingStatusId === o.orderId ? 'Updating…' : 'Mark Processing',
                icon: <RefreshCw size={13} />,
                onClick: () => changeStatus('processing'),
              }] : []),
              ...(o.status !== 'completed' && o.status !== 'cancelled' ? [{
                label: updatingStatusId === o.orderId ? 'Updating…' : 'Mark Shipped',
                icon: <Truck size={13} />,
                onClick: () => changeStatus('shipped'),
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
          <button className="flex items-center gap-1.5 bg-white text-[#4A4945] border border-bone rounded-[9px] px-4 py-[9px] text-[13px] font-medium cursor-pointer">
            Export CSV
          </button>
        }
      />

      <div className="px-7 py-5 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            label="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={<ShoppingCart size={16} />}
            loading={loading && !stats}
          />
          <MetricCard
            label="Revenue"
            value={stats ? `Rs ${stats.revenue.toLocaleString()}` : 0}
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
            value={stats ? `Rs ${stats.avgOrder.toLocaleString()}` : 0}
            icon={<TrendingUp size={16} />}
            loading={loading && !stats}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#FFF0F0] border border-[#FECACA] rounded-[10px] px-4 py-3 flex items-center gap-3">
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
            <div className="px-5 pt-4 pb-3 flex items-center gap-3 flex-wrap">
              <p className="text-[14px] font-bold text-charcoal shrink-0">All Orders</p>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search orders…"
                  className="w-[200px]"
                />
                <select
                  value={statusF || 'All Status'}
                  onChange={e => setStatusF(e.target.value === 'All Status' ? '' : e.target.value)}
                  className="text-[13px] px-3 py-[7px] rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer"
                >
                  {['All Status', 'pending', 'completed', 'cancelled', 'processing'].map(o => (
                    <option key={o} value={o}>{o === 'All Status' ? 'All Status' : o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={typeF || 'All Types'}
                  onChange={e => setTypeF(e.target.value === 'All Types' ? '' : e.target.value)}
                  className="text-[13px] px-3 py-[7px] rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer"
                >
                  {['All Types', 'digital', 'physical'].map(o => (
                    <option key={o} value={o}>{o === 'All Types' ? 'All Types' : o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setSearch(''); setStatusF(''); setTypeF(''); }}
                  className="text-[12px] text-slate border border-bone rounded-[6px] px-3 py-[7px] bg-white cursor-pointer hover:bg-bone shrink-0"
                >
                  Clear
                </button>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-[7px] hover:bg-bone shrink-0"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <SkeletonBox width={80}  height={13} rounded="4px" />
                    <SkeletonBox width={30}  height={30} rounded="999px" />
                    <SkeletonBox width="20%" height={13} />
                    <SkeletonBox width="25%" height={13} className="ml-auto" />
                    <SkeletonBox width="6%"  height={22} rounded="999px" />
                    <SkeletonBox width="8%"  height={13} />
                    <SkeletonBox width="8%"  height={13} />
                    <SkeletonBox width={56}  height={22} rounded="999px" />
                    <SkeletonBox width={28}  height={28} rounded="7px" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart size={30} className="text-brand-orange opacity-55" />}
                title={search || statusF || typeF ? 'No orders match your filters' : 'No orders yet'}
                description={
                  search || statusF || typeF
                    ? 'Try adjusting your search or filters.'
                    : 'Orders from your store will appear here once customers start purchasing.'
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filtered}
                keyExtractor={o => o.orderId}
                pagination={{
                  page,
                  total:    totalOrders,
                  perPage:  LIMIT,
                  onChange: handlePageChange,
                  label:    'orders',
                }}
              />
            )}
          </Card>
        )}

      </div>
    </>
  );
}
