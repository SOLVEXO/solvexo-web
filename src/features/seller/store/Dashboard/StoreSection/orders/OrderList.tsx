import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, AlertCircle, RefreshCw,
  DollarSign, Clock, TrendingUp, CheckCheck, Truck, Printer,
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
  Select,
  Button,
} from '@/components/comman/ui';
import { useShippingCarriers } from '@/hooks/shipping/useShippingCarriers';
import { buildTrackingUrl } from '@/api/services/shipping';
import {
  apiGetSellerOrders,
  apiExportOrdersCsv,
  type SellerOrder,
  type SellerOrderStats,
} from '@/api/services/product';
import { currencySymbol, fmt2 } from '@/utils/currency';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { apiGetSellerOrderDetail } from '@/api/services/product';
import { openPackingSlips, toPackingSlipOrder, type PackingSlipOrder } from '@/utils/packingSlip';

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
  // Quick-pick from the seller's own saved Carriers list (Shipping page) — ''
  // means "type it manually", the original free-text behavior.
  const { carriers } = useShippingCarriers(storeId);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');

  // Bulk selection (current page only) - cleared whenever the list reloads.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | 'print' | 'processing'>(null);
  const [bulkProgress, setBulkProgress] = useState('');
  const [bulkResult, setBulkResult] = useState<{ tone: 'success' | 'error'; message: string; failures: string[] } | null>(null);
  const staffUser = TokenStorage.getUser<{ role?: string; permissions?: string[] }>() as Parameters<typeof hasNavPermission>[0];
  const canPrint = hasNavPermission(staffUser, 'orders.view');
  const canFulfill = hasNavPermission(staffUser, 'orders.fulfill');

  const LIMIT = 10;
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    // Search, status and type are applied by the SERVER over every order (paginated), not on the loaded page.
    apiGetSellerOrders(storeId, page, LIMIT, undefined, {
      status: statusF || undefined,
      type: typeF || undefined,
      q: debouncedSearch.trim() || undefined,
    })
      .then(res => {
        if (cancelled) return;
        setOrders(res.data.orders ?? []);
        setSelected(new Set());
        setStats(res.data.stats);
        setTotalOrders(res.data.pagination.totalOrders);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [storeId, page, refreshKey, debouncedSearch, statusF, typeF]);

  const handlePageChange = (p: number) => {
    setSelected(new Set());
    setBulkResult(null);
    setLoading(true);
    setError('');
    setPage(p);
  };

  // A new search / filter always starts from page 1.
  useEffect(() => { setPage(1); }, [debouncedSearch, statusF, typeF]);

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

  const filtered = orders; // already filtered + searched server-side

  const selectedOrders = useMemo(() => orders.filter(o => selected.has(o.orderId)), [orders, selected]);
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const pendingSelected = selectedOrders.filter(o => o.status === 'pending');

  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(orders.map(o => o.orderId)));

  const handleBulkPrint = async () => {
    if (bulkBusy || selectedOrders.length === 0) return;
    setBulkBusy('print');
    setBulkResult(null);
    const targets = [...selectedOrders];
    const slips: PackingSlipOrder[] = [];
    const failures: string[] = [];
    for (let i = 0; i < targets.length; i += 5) {
      const batch = targets.slice(i, i + 5);
      setBulkProgress(`Loading ${Math.min(i + batch.length, targets.length)} of ${targets.length}...`);
      const results = await Promise.allSettled(batch.map(o => apiGetSellerOrderDetail(storeId, o.orderId)));
      results.forEach((r, idx) => {
        const o = batch[idx];
        if (r.status === 'fulfilled') slips.push(toPackingSlipOrder(r.value.data, o.orderNumber));
        else failures.push(`${o.orderNumber}: ${r.reason instanceof Error ? r.reason.message : 'failed to load'}`);
      });
    }
    let blocked = false;
    if (slips.length > 0) blocked = !openPackingSlips(slips, store?.name ?? '', currencySymbol(store?.baseCurrency));
    setBulkBusy(null);
    setBulkProgress('');
    if (blocked) {
      setBulkResult({ tone: 'error', message: 'Your browser blocked the print window. Allow pop-ups for this site and try again.', failures });
    } else if (failures.length > 0) {
      setBulkResult({
        tone: 'error',
        message: slips.length > 0
          ? `Opened ${slips.length} packing slip${slips.length !== 1 ? 's' : ''}; ${failures.length} failed.`
          : `Could not load any of the ${failures.length} selected orders.`,
        failures,
      });
    } else {
      setBulkResult({ tone: 'success', message: `Opened ${slips.length} packing slip${slips.length !== 1 ? 's' : ''}.`, failures: [] });
    }
  };

  const handleBulkProcessing = async () => {
    if (bulkBusy || pendingSelected.length === 0) return;
    setBulkBusy('processing');
    setBulkResult(null);
    const targets = [...pendingSelected];
    const skipped = selectedOrders.length - targets.length;
    const failures: string[] = [];
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      setBulkProgress(`Updating ${i + 1} of ${targets.length}...`);
      try {
        await apiUpdateOrderStatus({ orderId: targets[i].orderId, storeId, status: 'processing' });
        ok++;
      } catch (err: unknown) {
        failures.push(`${targets[i].orderNumber}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    setBulkBusy(null);
    setBulkProgress('');
    setBulkResult({
      tone: failures.length > 0 ? 'error' : 'success',
      message: `${ok} order${ok !== 1 ? 's' : ''} marked as processing${failures.length ? `, ${failures.length} failed` : ''}${skipped ? `, ${skipped} skipped (not pending)` : ''}.`,
      failures,
    });
    if (ok > 0) setRefreshKey(k => k + 1);
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: TableColumn<SellerOrder>[] = [
    {
      key: 'select', header: '', width: '40px',
      render: o => (
        <span role="presentation" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} className="flex items-center">
          <input
            type="checkbox"
            checked={selected.has(o.orderId)}
            onChange={() => toggleOne(o.orderId)}
            disabled={bulkBusy !== null}
            aria-label={`Select order ${o.orderNumber}`}
            className="cursor-pointer"
          />
        </span>
      ),
    },
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
          {currencySymbol(store?.baseCurrency)}{fmt2(o.amount)}
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
                  apiMarkOrderPaid(storeId, o.orderId)
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
              // Forward-only (mirrors the backend's isAllowedSellerOrderTransition): a
              // delivered/completed/cancelled/refunded order can't be shipped again, and
              // only an order that hasn't been closed out can be completed.
              ...(['pending', 'processing', 'shipped'].includes(o.status) ? [{
                label: 'Mark Shipped',
                icon: <Truck size={13} />,
                onClick: () => {
                  if (busy) return;
                  setTrackingForm({ carrier: '', trackingNumber: '', trackingUrl: '' });
                  setTrackingErrors({});
                  setSelectedCarrierId('');
                  setShippingOrder(o);
                },
              }] : []),
              ...(['pending', 'processing', 'shipped', 'delivered'].includes(o.status) ? [{
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
              <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-end">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search orders…"
                  className="w-[180px] sm:w-[200px] shrink-0"
                />
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
              </div>
            </div>

            {(canPrint || canFulfill) && orders.length > 0 && (
              <div className="px-4 sm:px-5 pb-3 flex flex-wrap items-center gap-3 border-b border-bone">
                <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={bulkBusy !== null} />
                  {selectedOrders.length > 0 ? `${selectedOrders.length} selected` : 'Select all on this page'}
                </label>
                {selectedOrders.length > 0 && (
                  <>
                    {canPrint && (
                      <Button variant="outline" size="sm" onClick={handleBulkPrint} loading={bulkBusy === 'print'} disabled={bulkBusy !== null}>
                        <Printer size={13} /> Print packing slips
                      </Button>
                    )}
                    {canFulfill && (
                      <Button
                        variant="outline" size="sm" onClick={handleBulkProcessing}
                        loading={bulkBusy === 'processing'}
                        disabled={bulkBusy !== null || pendingSelected.length === 0}
                      >
                        <RefreshCw size={13} /> Mark as processing{pendingSelected.length > 0 ? ` (${pendingSelected.length})` : ''}
                      </Button>
                    )}
                    <button
                      onClick={() => setSelected(new Set())}
                      disabled={bulkBusy !== null}
                      className="text-[12px] text-slate cursor-pointer hover:underline disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </>
                )}
                {bulkProgress && <span className="text-[12px] text-slate" role="status">{bulkProgress}</span>}
              </div>
            )}
            {bulkResult && (
              <div
                role="status"
                className={`mx-4 sm:mx-5 mt-3 rounded-[10px] px-4 py-3 text-[12.5px] border ${bulkResult.tone === 'success' ? 'bg-white border-bone text-charcoal' : 'bg-error-bg border-error-border text-error'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-1">{bulkResult.message}</span>
                  <button onClick={() => setBulkResult(null)} className="text-[12px] font-semibold cursor-pointer">Dismiss</button>
                </div>
                {bulkResult.failures.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {bulkResult.failures.map(f => <li key={f}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}

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
          {carriers.length > 0 && (
            <Field label="Carrier" hint="Pick a saved carrier to auto-build the tracking link, or choose Other to type it manually.">
              <Select
                value={selectedCarrierId}
                disabled={submittingTracking}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedCarrierId(id);
                  const picked = carriers.find(c => c._id === id);
                  setTrackingForm(f => ({
                    ...f,
                    carrier: picked ? picked.name : '',
                    trackingUrl: picked ? buildTrackingUrl(picked.trackingUrlTemplate, f.trackingNumber) : f.trackingUrl,
                  }));
                }}
              >
                <option value="">Other (type manually)</option>
                {carriers.filter(c => c.isActive).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}
          {(carriers.length === 0 || selectedCarrierId === '') && (
            <Field label={carriers.length > 0 ? 'Carrier name' : 'Carrier'} required error={trackingErrors.carrier}>
              <Input
                placeholder="e.g. DHL, FedEx, Local Courier"
                value={trackingForm.carrier}
                onChange={e => setTrackingForm(f => ({ ...f, carrier: e.target.value }))}
                disabled={submittingTracking}
              />
            </Field>
          )}
          <Field label="Tracking Number" required error={trackingErrors.trackingNumber}>
            <Input
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingForm.trackingNumber}
              onChange={e => {
                const trackingNumber = e.target.value;
                const picked = carriers.find(c => c._id === selectedCarrierId);
                setTrackingForm(f => ({
                  ...f,
                  trackingNumber,
                  trackingUrl: picked?.trackingUrlTemplate ? buildTrackingUrl(picked.trackingUrlTemplate, trackingNumber) : f.trackingUrl,
                }));
              }}
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
