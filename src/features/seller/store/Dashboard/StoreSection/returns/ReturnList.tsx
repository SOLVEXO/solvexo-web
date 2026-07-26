import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Modal, Textarea, Button, SkeletonBox } from '@/components/comman/ui';
import {
  apiGetSellerReturns, apiReturnAction,
  type SellerReturnItem, type ReturnStatus,
} from '@/api/services/orders';

const statusStyle: Record<string, { bg: string; color: string }> = {
  requested:          { bg: '#FFF4DC', color: '#B36200' },
  partial_requested:  { bg: '#FFF4DC', color: '#B36200' },
  approved:           { bg: '#E3F4EA', color: '#1E7A3C' },
  rejected:           { bg: '#FDECEA', color: '#C0392B' },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',          label: 'All Status' },
  { value: 'requested', label: 'Requested'  },
  { value: 'approved',  label: 'Approved'   },
  { value: 'rejected',  label: 'Rejected'   },
];

// ── Approve/Reject modal ─────────────────────────────────────────────────────
function ReturnActionModal({
  item, onClose, onDone,
}: {
  item: SellerReturnItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (chosen: 'approve' | 'reject') => {
    if (chosen === 'reject' && !rejectReason.trim()) { setAction('reject'); setError('Please provide a rejection reason.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiReturnAction(item.orderId, {
        storeId: item.storeId,
        itemIds: [item.itemId],
        action: chosen,
        rejectReason: chosen === 'reject' ? rejectReason.trim() : undefined,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Review Return — ${item.orderNumber}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {action === 'reject' ? (
            <Button variant="danger" onClick={() => submit('reject')} loading={saving}>Confirm Reject</Button>
          ) : (
            <>
              <Button variant="danger" onClick={() => setAction('reject')} disabled={saving}>Reject</Button>
              <Button onClick={() => submit('approve')} loading={saving}>Approve</Button>
            </>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-semibold text-charcoal">{item.productName}</p>
          <p className="text-[12px] text-slate mt-[2px]">Customer: {item.customer.name}</p>
          <p className="text-[12px] text-slate">Amount: ${item.amount.toLocaleString()}</p>
        </div>
        <div className="bg-cream rounded-[9px] px-3 py-[10px]">
          <p className="text-[11px] font-semibold text-slate uppercase tracking-[0.05em] mb-1">Customer's Reason</p>
          <p className="text-[13px] text-charcoal">{item.returnReason}</p>
        </div>
        {action === 'reject' && (
          <Textarea
            label="Rejection reason"
            rows={3}
            placeholder="Explain why this return is being rejected…"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        )}
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreReturnList() {
  usePageTitle('Returns');
  const { storeId } = useStoreWorkspace();

  const [returns, setReturns] = useState<SellerReturnItem[]>([]);
  const [stats, setStats]     = useState<{ openRequests: number; returnRate: string; totalRefunded: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [reviewing, setReviewing] = useState<SellerReturnItem | null>(null);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setLoading(true);
    apiGetSellerReturns({ storeId, status: status || undefined })
      .then(res => {
        if (cancelled) return;
        setReturns(res.data.returns ?? []);
        setStats(res.data.stats);
      })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load returns.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, status, refreshKey]);

  const filtered = returns.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.orderNumber.toLowerCase().includes(q) && !r.customer.name.toLowerCase().includes(q) && !r.productName.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Returns & Refunds"
        subtitle="Process return requests, issue refunds, and send replacements."
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics row ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Open Requests',  value: stats?.openRequests ?? 0 },
            { label: 'Return Rate',    value: stats?.returnRate ?? '—' },
            { label: 'Total Refunded (30d)', value: stats ? `$${stats.totalRefunded.toLocaleString()}` : '—' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-carbon leading-[1.15]">{loading ? '—' : m.value}</p>
            </div>
          ))}
        </div>

        {/* ── Return Policy Summary ── */}
        <div className="bg-white border border-bone rounded-[10px] px-[22px] py-[18px]">
          <p className="text-[14px] font-semibold text-carbon mb-1.5">Return Policy Summary</p>
          <p className="text-[13px] text-slate leading-[1.6]">
            Physical: 30-day returns in original condition. Digital: Non-refundable unless defective. Damaged items: replacement or full refund.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-bg border border-[#FECACA] rounded-[10px] px-4 py-3 flex items-center gap-3">
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  placeholder="Search order or customer..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-none outline-none text-[13px] py-2 w-[220px] text-charcoal"
                />
              </div>

              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="text-[13px] px-3 py-2 rounded-lg border border-bone bg-white text-charcoal outline-none cursor-pointer transition-colors duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <button onClick={refetch} className="flex items-center gap-1 text-[11px] text-slate cursor-pointer border border-bone rounded-[6px] px-2 py-[7px] transition-colors duration-150 hover:bg-bone shrink-0 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Order','Customer','Product','Reason','Amount','Status','Requested','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F0EEE6' }}>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={70} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={90} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={120} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={100} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={60} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={20} width={70} rounded="5px" /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={13} width={60} /></td>
                        <td className="px-4 py-[13px]"><SkeletonBox height={26} width={70} rounded="6px" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-[40px] text-center text-[13px] text-slate">
                        No return requests match your filters.
                      </td>
                    </tr>
                  ) : filtered.map((r, i) => {
                    const st = statusStyle[r.returnStatus] ?? { bg: '#F0EEE6', color: '#5A5852' };
                    return (
                      <tr
                        key={r.itemId}
                        className="transition-colors duration-150 hover:bg-cream"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none' }}
                      >
                        <td className="px-4 py-[13px] whitespace-nowrap">
                          <span className="text-[13px] font-bold text-[#B95A3A]">{r.orderNumber}</span>
                        </td>
                        <td className="px-4 py-[13px] text-[13px] text-graphite whitespace-nowrap">{r.customer.name}</td>
                        <td className="px-4 py-[13px] text-[13px] text-graphite max-w-[180px]">
                          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{r.productName}</span>
                        </td>
                        <td className="px-4 py-[13px] text-[13px] text-slate max-w-[180px]">
                          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{r.returnReason}</span>
                        </td>
                        <td className="px-4 py-[13px] text-[13px] font-semibold text-carbon whitespace-nowrap">
                          ${r.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-[13px]">
                          <span className="inline-block px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold whitespace-nowrap capitalize" style={{ background: st.bg, color: st.color }}>
                            {r.returnStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-[13px] text-xs text-slate whitespace-nowrap">
                          {new Date(r.returnRequestedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-[13px]">
                          <button
                            onClick={() => setReviewing(r)}
                            disabled={r.returnStatus !== 'requested' && r.returnStatus !== ('partial_requested' as ReturnStatus)}
                            className="px-[14px] py-1 bg-white border border-bone rounded-[6px] text-xs text-graphite cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-bone">
              <span className="text-xs text-slate">
                Showing {filtered.length} of {returns.length} return requests
              </span>
            </div>
          </div>
        )}
      </div>

      {reviewing && (
        <ReturnActionModal item={reviewing} onClose={() => setReviewing(null)} onDone={refetch} />
      )}
    </>
  );
}
