import { useEffect, useState } from 'react';
import { Avatar } from '@/components/comman/ui/Avatar';
import { Badge } from '@/components/comman/ui/Badge';
import { apiGetSales, apiGetSaleById, apiVoidSale, type Sale, type SaleStatus } from '@/api/services/pos/posSales';
import { apiGetDailyReport, type DailyReport } from '@/api/services/pos/posReports';
import { usePosSession } from '../context/PosSessionContext';
import { ReceiptOverlay } from './sale/ReceiptOverlay';
import { RefundOverlay } from './RefundOverlay';

const STATUS_COLORS: Record<SaleStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  completed:           'green',
  held:                'yellow',
  refunded:            'red',
  voided:              'red',
  partially_refunded:  'yellow',
};

export function OrdersTab() {
  const { storeId, session, employee, refreshSession } = usePosSession();

  const [sales, setSales]       = useState<Sale[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey]     = useState(0);

  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  const [viewingSale, setViewingSale]   = useState<Sale | null>(null);
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null);
  const [voidingSale, setVoidingSale]   = useState<Sale | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetSales({ storeId, page, status: statusFilter ? (statusFilter as SaleStatus) : undefined })
      .then(res => {
        if (cancelled) return;
        setSales(res.data.sales);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load transactions.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, statusFilter, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    apiGetDailyReport(storeId).then(res => { if (!cancelled) setDailyReport(res.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  function reload() { setRefreshKey(k => k + 1); }

  async function handleViewReceipt(saleId: string) {
    try {
      const res = await apiGetSaleById(saleId);
      setViewingSale(res.data);
    } catch {
      // ignore — row stays as-is
    }
  }

  async function handleVoidConfirm(reason: string) {
    if (!voidingSale) return;
    await apiVoidSale(voidingSale._id, { reason, actingEmployeeId: employee?._id });
    setVoidingSale(null);
    reload();
    refreshSession();
  }

  const dayStats = [
    { label: "Today's Sales",  value: dailyReport ? `$${dailyReport.summary.totalRevenue.toFixed(2)}` : '—', sub: dailyReport ? `${dailyReport.summary.totalTransactions} transactions` : '' },
    { label: 'Avg Ticket',     value: dailyReport ? `$${dailyReport.summary.avgTransactionValue.toFixed(2)}` : '—', sub: '' },
    { label: 'Top Item',       value: dailyReport?.topProducts[0]?.name ?? '—', sub: dailyReport?.topProducts[0] ? `${dailyReport.topProducts[0].qty} sold today` : '' },
    { label: 'Cash in Drawer', value: session ? `$${session.expectedCash.toFixed(2)}` : '—', sub: 'Expected (this shift)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Day stats */}
      <div className="flex gap-[14px] mb-5">
        {dayStats.map(({ label, value, sub }) => (
          <div key={label} className="flex-1 bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-pos-muted">{label}</p>
            <p className="text-[20px] font-bold text-white truncate">{value}</p>
            <p className="text-[11px] mt-[2px] text-pos-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-carbon">
          <p className="text-[14px] font-semibold text-white flex-1">Recent Transactions</p>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-carbon border-0 rounded-lg px-3 py-[6px] text-[12px] text-white outline-none"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="held">Held</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially refunded</option>
            <option value="voided">Voided</option>
          </select>
          <button onClick={reload} className="bg-carbon border-0 rounded-lg px-3 py-[6px] text-[11px] cursor-pointer text-pos-faint">
            Refresh
          </button>
        </div>

        {error && (
          <p className="px-4 py-3 text-[12px] text-error">{error}</p>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Order', 'Customer', 'Items', 'Total', 'Method', 'Time', 'Actions'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon text-pos-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[12px] text-pos-muted">Loading…</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[12px] text-pos-muted">No transactions found.</td></tr>
            ) : sales.map(s => (
              <tr key={s._id} className="border-b border-pos-surface">
                <td className="px-4 py-3">
                  <span className="text-[12px] font-bold text-brand-orange">{s.saleNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.customerName === 'Walk-in' ? 'WI' : s.customerName} size={24} variant="pos" />
                    <span className="text-[12px] text-white">{s.customerName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-pos-faint">{s.items.reduce((sum, i) => sum + i.qty, 0)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-white">${s.total.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge color={s.paymentMethod === 'card' ? 'blue' : s.paymentMethod === 'cash' ? 'green' : 'orange'}>
                    {s.paymentMethod}
                  </Badge>
                  <span className="ml-[6px]"><Badge color={STATUS_COLORS[s.status]}>{s.status.replace('_', ' ')}</Badge></span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-pos-muted">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-[6px]">
                    <button
                      onClick={() => handleViewReceipt(s._id)}
                      className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint"
                    >
                      Receipt
                    </button>
                    {(s.status === 'completed' || s.status === 'partially_refunded') && employee?.role === 'manager' && (
                      <button
                        onClick={() => setRefundingSale(s)}
                        className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error"
                      >
                        Refund
                      </button>
                    )}
                    {s.status === 'completed' && employee?.role === 'manager' && (
                      <button
                        onClick={() => setVoidingSale(s)}
                        className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-carbon">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-[11px] text-pos-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg bg-carbon border-0 text-white text-[11px] cursor-pointer disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {viewingSale && (
        <ReceiptOverlay sale={viewingSale} resetSale={() => setViewingSale(null)} />
      )}

      {refundingSale && (
        <RefundOverlay
          sale={refundingSale}
          actingEmployeeId={employee?._id}
          onClose={() => setRefundingSale(null)}
          onDone={() => { setRefundingSale(null); reload(); refreshSession(); }}
        />
      )}

      {voidingSale && (
        <VoidConfirmOverlay
          sale={voidingSale}
          onClose={() => setVoidingSale(null)}
          onConfirm={handleVoidConfirm}
        />
      )}
    </div>
  );
}

function VoidConfirmOverlay({ sale, onClose, onConfirm }: { sale: Sale; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function confirm() {
    setSaving(true);
    setError('');
    try {
      await onConfirm(reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void sale.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[340px] bg-pos-surface border border-carbon rounded-2xl p-5">
        <p className="text-[14px] font-bold text-white mb-2">Void {sale.saleNumber}?</p>
        <p className="text-[12px] text-pos-muted mb-3">This restores stock and reverses the sale from register totals. This cannot be undone.</p>
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[8px] text-[13px] text-white outline-none box-border mb-3"
        />
        {error && <p className="text-[11px] text-error mb-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] bg-carbon border-0 rounded-lg text-[12px] text-pos-faint cursor-pointer">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            className="flex-1 py-[9px] bg-error border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Voiding…' : 'Void Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
