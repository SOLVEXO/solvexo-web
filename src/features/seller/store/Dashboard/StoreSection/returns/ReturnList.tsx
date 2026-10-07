import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader, hasNavPermission } from '@/components/layouts/StoreLayout';
import { Table, Pagination, type TableColumn } from '@/components/comman/ui';
import { apiGetSellerReturns, type SellerReturnItem } from '@/api/services/orders';
import { apiGetSellerOrderDetail } from '@/api/services/product';
import type { SellerOrderDetailItem } from '@/api/services/product';
import { TokenStorage } from '@/api/services/auth';
import { ExchangeModal } from '../orders/ExchangeModal';
import { currencySymbol } from '@/utils/currency';
import { ReturnWorkflowModal } from './ReturnWorkflowModal';
import {
  PRIMARY_RETURN_LABEL, RETURN_STATUS_STYLE, primaryReturnMode, returnStatusLabel, type ReturnWorkflowMode,
} from './returnStatus';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',          label: 'All Status' },
  { value: 'requested', label: 'Requested'  },
  { value: 'approved',  label: 'Approved (awaiting items)' },
  { value: 'received',  label: 'Received'   },
  { value: 'refunded',  label: 'Refunded'   },
  { value: 'exchanged', label: 'Exchanged'  },
  { value: 'rejected',  label: 'Declined'   },
  { value: 'closed',    label: 'Closed'     },
];

const rowBtn = 'px-3 py-1 bg-white border border-bone rounded-[6px] text-xs text-graphite cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50';

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreReturnList() {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();

  const [returns, setReturns] = useState<SellerReturnItem[]>([]);
  const [stats, setStats]     = useState<{ openRequests: number; returnRate: string; totalRefunded: number } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [acting, setActing]   = useState<{ mode: ReturnWorkflowMode; item: SellerReturnItem } | null>(null);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  // Exchange: the same ExchangeModal as the order page. The order is loaded first (it needs the order's lines + paid state);
  // only the clicked return line is offered. Needs the `orders.return` permission, like the backend route.
  const canExchangePerm = hasNavPermission(TokenStorage.getUser() as Parameters<typeof hasNavPermission>[0], 'orders.return');
  const [exchangeLoading, setExchangeLoading] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState('');
  const [exchanging, setExchanging] = useState<{ item: SellerReturnItem; lines: SellerOrderDetailItem[]; isPaid: boolean } | null>(null);
  const openExchange = (r: SellerReturnItem) => {
    setExchangeLoading(r.itemId);
    setExchangeError('');
    apiGetSellerOrderDetail(r.storeId, r.orderId)
      .then(res => {
        const d = res.data;
        const lines = d.sellerOrder.items.filter(i => i._id === r.itemId && i.type === 'physical' && ['requested', 'approved', 'received'].includes(i.returnStatus) && !i.exchangeOrderId);
        if (d.exchangeOf) setExchangeError('This order is itself an exchange order and cannot be exchanged again.');
        else if (lines.length === 0) setExchangeError('This return line can no longer be exchanged - refresh the list.');
        else setExchanging({ item: r, lines, isPaid: d.isPaid });
      })
      .catch((err: unknown) => setExchangeError(err instanceof Error ? err.message : 'Could not load the order.'))
      .finally(() => setExchangeLoading(null));
  };

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetSellerReturns({ storeId, status: status || undefined, page })
      .then(res => {
        if (cancelled) return;
        setReturns(res.data.returns ?? []);
        setStats(res.data.stats);
        setPagination({ page: res.data.pagination.page, limit: res.data.pagination.limit, total: res.data.pagination.total });
      })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load returns.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, status, page, refreshKey]);

  const filtered = returns.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.orderNumber.toLowerCase().includes(q) && !r.customer.name.toLowerCase().includes(q) && !r.productName.toLowerCase().includes(q)) return false;
    return true;
  });

  const columns: TableColumn<SellerReturnItem>[] = [
    { key: 'orderNumber', header: 'Order', render: r => <span className="font-bold text-brand-deep-orange whitespace-nowrap">{r.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: r => <span className="text-graphite whitespace-nowrap">{r.customer.name}</span> },
    { key: 'productName', header: 'Product', render: r => <span className="text-graphite max-w-[180px] truncate block">{r.productName}</span> },
    { key: 'returnReason', header: 'Reason', render: r => <span className="text-slate max-w-[180px] truncate block">{r.returnReason}</span> },
    { key: 'amount', header: 'Amount', render: r => <span className="font-semibold text-carbon whitespace-nowrap">{currencySymbol(store?.baseCurrency)}{r.amount.toLocaleString()}</span> },
    {
      key: 'returnStatus', header: 'Status',
      render: r => {
        const st = RETURN_STATUS_STYLE[r.returnStatus] ?? { bg: '#F0EEE6', color: '#5A5852', label: r.returnStatus };
        return (
          <span className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap" style={{ background: st.bg, color: st.color }}>
            {returnStatusLabel(r.returnStatus)}
          </span>
        );
      },
    },
    { key: 'returnRequestedAt', header: 'Requested', render: r => <span className="text-xs text-slate whitespace-nowrap">{new Date(r.returnRequestedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span> },
    {
      key: 'actions', header: 'Actions',
      render: r => {
        const mode = primaryReturnMode(r.returnStatus);
        const canClose = r.returnStatus === 'approved' || r.returnStatus === 'received';
        return (
          <div className="flex items-center gap-1.5">
            {mode && <button onClick={() => setActing({ mode, item: r })} className={rowBtn}>{PRIMARY_RETURN_LABEL[mode]}</button>}
            {canClose && <button onClick={() => setActing({ mode: 'close', item: r })} className={rowBtn}>Close</button>}
            {canExchangePerm && ['requested', 'approved', 'received'].includes(r.returnStatus) && !r.exchangeOrderId && r.itemType !== 'digital' && (
              <button onClick={() => openExchange(r)} disabled={exchangeLoading === r.itemId} className={rowBtn}>
                {exchangeLoading === r.itemId ? 'Loading...' : 'Exchange'}
              </button>
            )}
            <button onClick={() => navigate(`/store/${storeId}/orders/detail/${r.orderId}`)} className={rowBtn}>
              {mode ? 'Order / label' : 'Order'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Returns & Refunds"
        subtitle="Approve returns, mark items as received, then refund or exchange them."
      />

      <div className="px-4 lg:px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Open Returns',  value: stats?.openRequests ?? 0 },
            { label: 'Return Rate',    value: stats?.returnRate ?? '—' },
            { label: 'Total Refunded (30d)', value: stats ? `${currencySymbol(store?.baseCurrency)}${stats.totalRefunded.toLocaleString()}` : '—' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-carbon leading-[1.15]">{loading ? '—' : m.value}</p>
            </div>
          ))}
        </div>

        {/* ── How returns work ── */}
        <div className="bg-white border border-bone rounded-[10px] px-[22px] py-[18px]">
          <p className="text-[14px] font-semibold text-carbon mb-1.5">How returns work</p>
          <p className="text-[13px] text-slate leading-[1.6]">
            1. Approve the request (no money moves). 2. When the items arrive, mark them as received and choose whether to restock. 3. Refund them to the original payment method or store credit, or exchange them for other items.
          </p>
        </div>

        {exchangeError && (
          <div role="alert" className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{exchangeError}</span>
            <button onClick={() => setExchangeError('')} className="text-[12px] text-error font-semibold cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{error}</span>
            <button onClick={refetch} className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ── Table card ── */}
        {!error && (
          <div className="bg-white border border-bone rounded-[10px] overflow-hidden">

            {/* Filters */}
            <div className="flex items-center gap-[10px] px-5 py-[14px] border-b border-bone flex-wrap">
              <div className="flex items-center gap-1.5 border border-bone rounded-lg px-3 bg-white transition-colors duration-150 focus-within:ring-2 focus-within:ring-brand-orange/40 focus-within:border-brand-orange/50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  aria-label="Search returns on this page"
                  placeholder="Search order or customer..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-none outline-none text-[13px] py-2 w-[220px] text-charcoal"
                />
              </div>

              <select
                aria-label="Filter by return status"
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <button onClick={refetch} className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-[7px] transition-colors duration-150 hover:bg-bone shrink-0 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={r => r.itemId}
              loading={loading}
              emptyState={{ title: 'No returns match your filters.' }}
            />

            <div className="px-5 py-3 border-t border-bone flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate">
                Showing {filtered.length} of {pagination.total} returns
              </span>
              <Pagination page={pagination.page} total={pagination.total} perPage={pagination.limit} onChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {exchanging && (
        <ExchangeModal
          storeId={exchanging.item.storeId}
          orderId={exchanging.item.orderId}
          orderNumber={exchanging.item.orderNumber}
          lines={exchanging.lines}
          symbol={currencySymbol(store?.baseCurrency)}
          isPaid={exchanging.isPaid}
          onClose={() => setExchanging(null)}
          onDone={() => { setExchanging(null); refetch(); }}
        />
      )}

      {acting && (
        <ReturnWorkflowModal
          mode={acting.mode}
          storeId={acting.item.storeId}
          orderId={acting.item.orderId}
          orderNumber={acting.item.orderNumber}
          customerName={acting.item.customer.name}
          lines={[{ itemId: acting.item.itemId, name: acting.item.productName, quantity: acting.item.quantity, reason: acting.item.returnReason }]}
          onClose={() => setActing(null)}
          onDone={refetch}
        />
      )}
    </>
  );
}
