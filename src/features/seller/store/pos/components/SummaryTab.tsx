import { useEffect, useState } from 'react';
import { apiGetSessionReport, apiCloseSession, type SessionReport } from '@/api/commerce/posSessions';
import { usePosSession } from '../context/PosSessionContext';

interface SummaryTabProps {
  onShiftClosed: () => void;
}

export function SummaryTab({ onShiftClosed }: SummaryTabProps) {
  const { sessionId, registerName, employee, refreshSession } = usePosSession();

  const [report, setReport]   = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [showClose, setShowClose] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    apiGetSessionReport(sessionId)
      .then(res => { if (!cancelled) setReport(res.data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shift summary.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId, refreshKey]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-[13px] text-pos-muted">Loading shift summary…</p></div>;
  }
  if (error || !report) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-[13px] text-error">{error || 'No active shift.'}</p></div>;
  }

  const { session, summary } = report;
  const openedAt = new Date(session.openedAt);

  const shiftMetrics = [
    { label: 'Total Sales',     value: `$${summary.totalSales.toFixed(2)}`, sub: `${summary.completedSales} transactions` },
    { label: 'Cash Sales',      value: `$${summary.byPaymentMethod.cash.total.toFixed(2)}`, sub: `${summary.byPaymentMethod.cash.count} transactions` },
    { label: 'Card Sales',      value: `$${summary.byPaymentMethod.card.total.toFixed(2)}`, sub: `${summary.byPaymentMethod.card.count} transactions` },
    { label: 'Other Sales',     value: `$${summary.byPaymentMethod.other.total.toFixed(2)}`, sub: `${summary.byPaymentMethod.other.count} transactions` },
    { label: 'Held Sales',      value: `${summary.heldSales}`, sub: 'Awaiting completion' },
    { label: 'Refunds',         value: `$${summary.refundsTotal.toFixed(2)}`, sub: `${summary.refundsCount} refunds` },
  ];

  const drawerRows: [string, string, boolean][] = [
    ['Opening Float',    `$${summary.cashFlow.openingCash.toFixed(2)}`, false],
    ['Cash Sales',       `$${summary.cashFlow.cashSales.toFixed(2)}`,   false],
    ['Cash In',          `+$${summary.cashFlow.cashIn.toFixed(2)}`,     false],
    ['Cash Out',         `−$${summary.cashFlow.cashOut.toFixed(2)}`,    false],
    ['Expected',         `$${summary.cashFlow.expectedCash.toFixed(2)}`, false],
    ...(summary.cashFlow.closingCash !== null
      ? ([
          ['Actual (counted)', `$${summary.cashFlow.closingCash.toFixed(2)}`, false],
          ['Variance',         `${summary.cashFlow.cashDifference >= 0 ? '+' : '−'}$${Math.abs(summary.cashFlow.cashDifference).toFixed(2)}`, true],
        ] as [string, string, boolean][])
      : []),
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-6">
        <p className="text-[18px] font-bold text-white flex-1">Shift Summary</p>
        <p className="text-[12px] text-pos-muted">
          Opened {openedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {openedAt.toLocaleDateString()}
          {registerName ? ` · ${registerName}` : ''}
        </p>
        {session.status === 'open' && (
          <button
            onClick={() => setShowClose(true)}
            className="px-4 py-2 bg-[#C1303020] border border-error rounded-lg text-[12px] font-semibold text-error cursor-pointer"
          >
            Close Shift
          </button>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-[14px] mb-6">
        {shiftMetrics.map(({ label, value, sub }) => (
          <div key={label} className="bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-pos-muted">{label}</p>
            <p className="text-[22px] font-bold text-white">{value}</p>
            <p className="text-[11px] mt-[2px] text-pos-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Cash drawer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Cash Drawer Reconciliation</p>
          {drawerRows.map(([label, val, isWarning]) => (
            <div key={label} className="flex justify-between pb-2 mb-2 border-b border-carbon">
              <span className="text-[12px] text-pos-faint">{label}</span>
              <span className={isWarning ? 'text-[12px] font-medium text-warning' : 'text-[12px] font-medium text-white'}>
                {val}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Employee</p>
          <p className="text-[12px] text-white">{employee?.name}</p>
          <p className="text-[11px] text-pos-muted mt-1">{employee?.email}</p>
          <p className="text-[11px] text-pos-muted mt-1 capitalize">{employee?.role}</p>
        </div>
      </div>

      {showClose && (
        <CloseShiftOverlay
          sessionId={session._id}
          expectedCash={summary.cashFlow.expectedCash}
          onClose={() => setShowClose(false)}
          onClosed={() => {
            setShowClose(false);
            setRefreshKey(k => k + 1);
            refreshSession();
            onShiftClosed();
          }}
        />
      )}
    </div>
  );
}

function CloseShiftOverlay({
  sessionId, expectedCash, onClose, onClosed,
}: {
  sessionId: string;
  expectedCash: number;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [closingCash, setClosingCash] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    const cash = parseFloat(closingCash);
    if (isNaN(cash) || cash < 0) { setError('Enter a valid counted cash amount.'); return; }
    setError('');
    setSaving(true);
    try {
      await apiCloseSession({ sessionId, closingCash: cash });
      onClosed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close shift.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="w-[340px] bg-pos-surface border border-carbon rounded-2xl p-5">
        <p className="text-[14px] font-bold text-white mb-2">Close Shift</p>
        <p className="text-[12px] text-pos-muted mb-3">Expected cash in drawer: <span className="text-white font-semibold">${expectedCash.toFixed(2)}</span></p>
        <input
          value={closingCash}
          onChange={e => setClosingCash(e.target.value)}
          placeholder="Counted cash amount"
          inputMode="decimal"
          autoFocus
          className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[9px] text-[13px] text-white outline-none box-border mb-3"
        />
        {error && <p className="text-[11px] text-error mb-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] bg-carbon border-0 rounded-lg text-[12px] text-pos-faint cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-[9px] bg-error border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Closing…' : 'Confirm & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
