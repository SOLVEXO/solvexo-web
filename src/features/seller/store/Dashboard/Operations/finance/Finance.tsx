import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Download, Plus, X, Star } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiGetFinanceDashboard, apiGetFinanceTransactions, apiExportFinanceTransactions,
  apiRequestPayout, apiGetPayouts, apiGetPayoutById,
  apiGetPayoutMethods, apiAddPayoutMethod, apiUpdatePayoutMethod, apiSetDefaultPayoutMethod,
  apiDeletePayoutMethod, apiGetPayoutSchedule, apiUpdatePayoutSchedule,
  apiGetTaxReports, apiGenerateTaxReport,
  type FinanceDashboard, type Transaction, type TransactionType, type PayoutMethod,
  type PayoutMethodType, type PayoutSchedule, type TaxReport, type Payout, type PayoutStatus,
} from '@/api/services/finance';

const TYPE_STYLE: Record<TransactionType, { bg: string; color: string; label: string }> = {
  sale:       { bg: '#E3F4EA', color: '#1E7A3C', label: 'Sale' },
  payout:     { bg: '#F0EEE6', color: '#5A5852', label: 'Payout' },
  fee:        { bg: '#FFF4DC', color: '#B36200', label: 'Fee' },
  refund:     { bg: '#FDECEA', color: '#C0392B', label: 'Refund' },
  adjustment: { bg: '#E4F0FB', color: '#1F5FA8', label: 'Adjustment' },
};

const METHOD_LABEL: Record<PayoutMethodType, string> = {
  bank_transfer: 'Bank Transfer', paypal: 'PayPal', stripe: 'Stripe',
};

const PAYOUT_STATUS_STYLE: Record<PayoutStatus, { bg: string; color: string }> = {
  pending:    { bg: '#FDF2DA', color: '#946200' },
  processing: { bg: '#E4F0FB', color: '#1F5FA8' },
  completed:  { bg: '#E3F4EA', color: '#1E7A3C' },
  failed:     { bg: '#FDECEA', color: '#C0392B' },
};

function fmt(n: number) { return `$${n.toFixed(2)}`; }

// ── Payout method modal (add or edit) ────────────────────────────────────────
function PayoutMethodModal({
  onClose, onSaved, storeId, editing,
}: { onClose: () => void; onSaved: () => void; storeId: string; editing?: PayoutMethod | null }) {
  const [type, setType] = useState<PayoutMethodType>(editing?.type ?? 'bank_transfer');
  const [bankName, setBankName] = useState(editing?.bankName ?? '');
  const [accountHolder, setAccountHolder] = useState(editing?.accountHolder ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState(editing?.routingNumber ?? '');
  const [externalAccountId, setExternalAccountId] = useState(editing?.externalAccountId ?? '');
  const [setAsDefault, setSetAsDefault] = useState(editing?.isDefault ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    const payload = {
      type, setAsDefault,
      ...(type === 'bank_transfer'
        ? { bankName, accountHolder, ...(accountNumber ? { accountNumber } : {}), routingNumber }
        : { externalAccountId }),
    };
    try {
      if (editing) await apiUpdatePayoutMethod(storeId, editing._id, payload);
      else await apiAddPayoutMethod(storeId, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payout method.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit Payout Method' : 'Add Payout Method'} width={420} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-[12px] text-error">{error}</p>}
        <div className="flex gap-2">
          {(['bank_transfer', 'paypal', 'stripe'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="flex-1 px-2.5 py-2 rounded-lg text-[12px] font-semibold border cursor-pointer"
              style={{ borderColor: type === t ? '#D97757' : '#E8E6DC', background: type === t ? '#FBECE4' : '#fff', color: type === t ? '#B95A3A' : '#5A5852' }}>
              {METHOD_LABEL[t]}
            </button>
          ))}
        </div>
        {type === 'bank_transfer' ? (
          <>
            <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name"
              className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
            <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account holder name"
              className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
            <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
              placeholder={editing ? `Account number (leave blank to keep ••${editing.accountLast4 ?? '----'})` : 'Account number'}
              className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
            <input value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} placeholder="Routing number"
              className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
          </>
        ) : (
          <input value={externalAccountId} onChange={e => setExternalAccountId(e.target.value)}
            placeholder={type === 'paypal' ? 'PayPal email' : 'Stripe account ID'}
            className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
        )}
        <label className="flex items-center gap-2 text-[12.5px] text-graphite cursor-pointer">
          <input type="checkbox" checked={setAsDefault} onChange={e => setSetAsDefault(e.target.checked)} />
          Set as default payout method
        </label>
        <Button size="sm" loading={saving} onClick={handleSave}>Save Method</Button>
      </div>
    </Modal>
  );
}

// ── Request payout modal ─────────────────────────────────────────────────────
function RequestPayoutModal({
  onClose, onRequested, storeId, availableBalance, methods,
}: { onClose: () => void; onRequested: () => void; storeId: string; availableBalance: number; methods: PayoutMethod[] }) {
  const defaultMethod = methods.find(m => m.isDefault) ?? methods[0] ?? null;
  const [methodId, setMethodId] = useState(defaultMethod?._id ?? '');
  const [amount, setAmount] = useState(String(availableBalance));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!methodId) { setError('Select a payout method.'); return; }
    if (!amt || amt < 1) { setError('Enter a valid amount.'); return; }
    if (amt > availableBalance) { setError(`Amount exceeds available balance (${fmt(availableBalance)}).`); return; }
    setSaving(true); setError('');
    try {
      await apiRequestPayout(storeId, amt, methodId, notes || undefined);
      onRequested();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Request Payout" width={420} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-[12px] text-error">{error}</p>}
        <p className="text-[12px] text-slate">Available balance: <span className="font-semibold text-carbon">{fmt(availableBalance)}</span></p>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
          className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
        <select value={methodId} onChange={e => setMethodId(e.target.value)}
          className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none bg-white">
          <option value="">Select payout method…</option>
          {methods.map(m => (
            <option key={m._id} value={m._id}>
              {METHOD_LABEL[m.type]}{m.bankName ? ` — ${m.bankName}` : ''}{m.accountLast4 ? ` ••${m.accountLast4}` : ''}{m.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
          className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
        <Button size="sm" loading={saving} disabled={!methods.length} onClick={handleSubmit}>
          {methods.length ? 'Request Payout' : 'Add a payout method first'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Payout schedule modal ────────────────────────────────────────────────────
function ScheduleModal({ onClose, onSaved, storeId, schedule }: { onClose: () => void; onSaved: () => void; storeId: string; schedule: PayoutSchedule }) {
  const [frequency, setFrequency] = useState(schedule.frequency);
  const [minimumAmount, setMinimumAmount] = useState(String(schedule.minimumAmount));
  const [isEnabled, setIsEnabled] = useState(schedule.isEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await apiUpdatePayoutSchedule(storeId, { frequency, minimumAmount: parseFloat(minimumAmount) || 1, isEnabled });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Payout Schedule" width={380} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <p className="text-[12px] text-error">{error}</p>}
        <select value={frequency} onChange={e => setFrequency(e.target.value as typeof frequency)}
          className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none bg-white">
          {(['daily', 'weekly', 'biweekly', 'monthly', 'manual'] as const).map(f => (
            <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>
          ))}
        </select>
        <input type="number" value={minimumAmount} onChange={e => setMinimumAmount(e.target.value)} placeholder="Minimum payout amount"
          className="px-3 py-2 border border-bone rounded-lg text-[13px] outline-none" />
        <label className="flex items-center gap-2 text-[12.5px] text-graphite cursor-pointer">
          <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
          Enable automatic payouts
        </label>
        <Button size="sm" loading={saving} onClick={handleSave}>Save Schedule</Button>
      </div>
    </Modal>
  );
}

// ── Payout detail modal ───────────────────────────────────────────────────────
function PayoutDetailModal({ onClose, storeId, payoutId }: { onClose: () => void; storeId: string; payoutId: string }) {
  const [payout, setPayout] = useState<Payout | null>(null);
  useEffect(() => { apiGetPayoutById(storeId, payoutId).then(setPayout).catch(() => {}); }, [storeId, payoutId]);

  return (
    <Modal title="Payout Details" width={380} onClose={onClose}>
      {!payout ? (
        <SkeletonBox height={120} rounded="8px" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {[
            ['Amount', fmt(payout.amount)],
            ['Status', payout.status ? payout.status[0].toUpperCase() + payout.status.slice(1) : '—'],
            ['Method', payout.payoutMethodSnapshot ? `${METHOD_LABEL[payout.payoutMethodSnapshot.type as PayoutMethodType] ?? payout.payoutMethodSnapshot.type}${payout.payoutMethodSnapshot.accountLast4 ? ` ••${payout.payoutMethodSnapshot.accountLast4}` : ''}` : '—'],
            ['Requested', new Date(payout.createdAt).toLocaleString()],
            ['Processed', payout.processedAt ? new Date(payout.processedAt).toLocaleString() : '—'],
            ['Notes', payout.notes ?? '—'],
            ...(payout.failureReason ? [['Failure reason', payout.failureReason]] : []),
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-start gap-3">
              <span className="text-xs text-slate shrink-0">{label}</span>
              <span className="text-xs font-medium text-graphite text-right">{val}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreFinance() {
  usePageTitle('Finance');
  const { storeId } = useStoreWorkspace();

  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txPages, setTxPages] = useState(1);
  const [txType, setTxType] = useState<TransactionType | ''>('');
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [generatingTax, setGeneratingTax] = useState(false);

  const [methodModal, setMethodModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);
  const [payoutModal, setPayoutModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [deleteMethodBusy, setDeleteMethodBusy] = useState(false);
  const [deleteMethodError, setDeleteMethodError] = useState('');

  const loadCore = useCallback(() => {
    if (!storeId) return;
    setLoading(true); setError('');
    Promise.all([
      apiGetFinanceDashboard(storeId),
      apiGetPayoutMethods(storeId),
      apiGetPayoutSchedule(storeId),
      apiGetTaxReports(storeId),
      apiGetPayouts(storeId, { limit: 5 }),
    ])
      .then(([d, m, s, t, p]) => { setDashboard(d); setMethods(m ?? []); setSchedule(s); setTaxReports(t ?? []); setRecentPayouts(p.payouts ?? []); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load finance data.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  const loadTransactions = useCallback(() => {
    if (!storeId) return;
    apiGetFinanceTransactions(storeId, { page: txPage, limit: 10, type: txType || undefined })
      .then(res => { setTransactions(res.transactions ?? []); setTxPages(res.pages); })
      .catch(() => {});
  }, [storeId, txPage, txType]);

  useEffect(loadCore, [loadCore]);
  useEffect(loadTransactions, [loadTransactions]);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await apiExportFinanceTransactions(storeId, { type: txType || undefined });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `transactions-${storeId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateTaxReport() {
    setGeneratingTax(true);
    try {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3) + 1;
      await apiGenerateTaxReport(storeId, now.getFullYear(), `q${q}` as 'q1' | 'q2' | 'q3' | 'q4');
      const reports = await apiGetTaxReports(storeId);
      setTaxReports(reports ?? []);
    } finally {
      setGeneratingTax(false);
    }
  }

  async function handleSetDefaultMethod(methodId: string) {
    await apiSetDefaultPayoutMethod(storeId, methodId);
    const m = await apiGetPayoutMethods(storeId);
    setMethods(m ?? []);
  }

  async function confirmDeleteMethod() {
    if (!deletingMethodId) return;
    setDeleteMethodBusy(true);
    setDeleteMethodError('');
    try {
      await apiDeletePayoutMethod(storeId, deletingMethodId);
      const m = await apiGetPayoutMethods(storeId);
      setMethods(m ?? []);
      setDeletingMethodId(null);
    } catch (err) {
      setDeleteMethodError(err instanceof Error ? err.message : 'Failed to delete payout method.');
    } finally {
      setDeleteMethodBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">
        <SkeletonBox height={110} rounded="12px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={90} rounded="10px" />)}
        </div>
        <div className="flex gap-4">
          <SkeletonBox height={320} rounded="10px" className="flex-1" />
          <SkeletonBox height={320} rounded="10px" width={280} />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="px-7 pt-5 pb-8">
        <p className="text-[13px] text-error">{error || 'Failed to load finance data.'}</p>
      </div>
    );
  }

  return (
    <>
      <SellerPageHeader
        title="Finance & Payouts"
        subtitle="Track earnings, payouts, fees, and tax reports."
        actions={
          <>
            <Button size="sm" variant="outline" icon={<Plus size={13} />} onClick={() => setMethodModal(true)}>
              Add Payout Method
            </Button>
            <Button size="sm" onClick={() => setPayoutModal(true)} disabled={dashboard.availableBalance <= 0}>
              Request Payout
            </Button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Balance Card */}
        <div className="bg-carbon rounded-xl px-7 py-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.1em] mb-2">Available Balance</p>
            <p className="text-[32px] font-bold text-white leading-[1.1] mb-3">{fmt(dashboard.availableBalance)}</p>
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-[11px] text-slate">Pending: <span className="text-white font-medium">{fmt(dashboard.pendingBalance)}</span></span>
              {dashboard.nextPayout.scheduledAt && (
                <span className="text-[11px] text-brand-orange font-medium">
                  Next Payout: {new Date(dashboard.nextPayout.scheduledAt).toLocaleDateString()}
                </span>
              )}
              {dashboard.nextPayout.method && (
                <span className="text-[11px] text-slate">
                  Method: {METHOD_LABEL[dashboard.nextPayout.method.type as PayoutMethodType] ?? dashboard.nextPayout.method.type}
                  {dashboard.nextPayout.method.last4 ? ` ••${dashboard.nextPayout.method.last4}` : ''}
                </span>
              )}
            </div>
          </div>
          <Button size="md" onClick={() => setPayoutModal(true)} disabled={dashboard.availableBalance <= 0} iconRight={<ArrowRight size={14} />}>
            Request Payout
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'This Month Revenue', value: fmt(dashboard.summary.thisMonthRevenue), trend: `${dashboard.summary.revenueGrowthPercent >= 0 ? '+' : ''}${dashboard.summary.revenueGrowthPercent}% vs last month` },
            { label: 'Platform Fees', value: fmt(dashboard.summary.platformFees), sub: 'This month' },
            { label: 'Total Paid Out', value: fmt(dashboard.summary.totalPaidOut), sub: 'All time' },
            { label: 'Pending Tax', value: fmt(dashboard.summary.pendingTax), sub: 'Estimated' },
          ].map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-carbon leading-[1.15]">{m.value}</p>
              {'trend' in m && m.trend && <p className="text-xs text-[#2D8A4E] mt-1">{m.trend}</p>}
              {'sub' in m && m.sub && <p className="text-xs text-slate mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

          {/* LEFT — Transaction History */}
          <div className="flex-1 min-w-0 w-full bg-white border border-bone rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-bone flex-wrap gap-2.5">
              <p className="text-sm font-semibold text-carbon">Transaction History</p>
              <div className="flex items-center gap-2">
                <select value={txType} onChange={e => { setTxType(e.target.value as TransactionType | ''); setTxPage(1); }}
                  className="px-3 py-[7px] text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none">
                  <option value="">All Types</option>
                  {Object.entries(TYPE_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <Button size="sm" variant="outline" icon={<Download size={12} />} loading={exporting} onClick={handleExport}>
                  Export CSV
                </Button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-slate">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Date', 'Description', 'Type', 'Amount', 'Balance'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-cream whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => {
                      const ts = TYPE_STYLE[t.type];
                      return (
                        <tr key={t._id} style={{ borderBottom: i < transactions.length - 1 ? '1px solid #F0EEE6' : 'none' }}>
                          <td className="px-4 py-3 text-[13px] text-slate whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-[13px] text-graphite">{t.description}</td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold" style={{ background: ts.bg, color: ts.color }}>
                              {ts.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold whitespace-nowrap" style={{ color: t.amount >= 0 ? '#2D8A4E' : '#C13030' }}>
                            {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-medium text-carbon whitespace-nowrap">{fmt(t.balanceAfter)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {txPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-bone">
                <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}
                  className="px-2.5 py-1 text-[12px] border border-bone rounded-[6px] bg-white disabled:opacity-40 cursor-pointer">Prev</button>
                <span className="text-[12px] text-slate">Page {txPage} / {txPages}</span>
                <button disabled={txPage >= txPages} onClick={() => setTxPage(p => p + 1)}
                  className="px-2.5 py-1 text-[12px] border border-bone rounded-[6px] bg-white disabled:opacity-40 cursor-pointer">Next</button>
              </div>
            )}
          </div>

          {/* RIGHT — 3 stacked cards */}
          <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3.5">

            {/* Payout Methods */}
            <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-carbon">Payout Methods</p>
                <button onClick={() => setMethodModal(true)} className="text-slate hover:text-brand-orange cursor-pointer bg-transparent border-none">
                  <Plus size={14} />
                </button>
              </div>
              {methods.length === 0 ? (
                <p className="text-xs text-slate">No payout methods yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {methods.map(m => (
                    <div key={m._id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {m.isDefault && <Star size={11} className="text-brand-orange shrink-0" fill="#D97757" />}
                        <span className="text-xs text-graphite truncate">
                          {METHOD_LABEL[m.type]}{m.accountLast4 ? ` ••${m.accountLast4}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!m.isDefault && (
                          <button onClick={() => handleSetDefaultMethod(m._id)} className="text-[10px] text-slate hover:text-brand-orange cursor-pointer bg-transparent border-none">
                            Set default
                          </button>
                        )}
                        <button onClick={() => setEditingMethod(m)} className="text-[10px] text-slate hover:text-brand-orange cursor-pointer bg-transparent border-none">
                          Edit
                        </button>
                        <button onClick={() => { setDeletingMethodId(m._id); setDeleteMethodError(''); }} className="text-slate hover:text-error cursor-pointer bg-transparent border-none">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout Schedule */}
            {schedule && (
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
                <p className="text-[13px] font-semibold text-carbon mb-3">Payout Schedule</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    ['Frequency', schedule.frequency ? schedule.frequency[0].toUpperCase() + schedule.frequency.slice(1) : '—'],
                    ['Status', schedule.isEnabled ? 'Enabled' : 'Disabled'],
                    ['Minimum', fmt(schedule.minimumAmount)],
                    ['Next Payout', schedule.nextPayoutAt ? new Date(schedule.nextPayoutAt).toLocaleDateString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-xs text-slate">{label}</span>
                      <span className="text-xs font-medium text-graphite">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#F0EEE6]">
                  <button onClick={() => setScheduleModal(true)}
                    className="px-3.5 py-1.5 bg-white border border-bone rounded-[7px] text-xs text-graphite cursor-pointer hover:border-brand-orange/40">
                    Update Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
              <p className="text-[13px] font-semibold text-carbon mb-3">Fee Breakdown</p>
              <div className="flex flex-col gap-2.5">
                {[
                  ['Marketplace Listing Fee', dashboard.feeBreakdown.marketplaceListingFee],
                  ['Transaction Fee', dashboard.feeBreakdown.transactionFee],
                  ['Payment Processing', dashboard.feeBreakdown.paymentProcessing],
                  ['Digital Delivery', dashboard.feeBreakdown.digitalDelivery],
                  ['AI Credits', dashboard.feeBreakdown.aiCredits],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-slate">{label}</span>
                    <span className="text-xs font-medium text-graphite">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Reports */}
            <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-carbon">Tax Reports</p>
                <button onClick={handleGenerateTaxReport} disabled={generatingTax}
                  className="text-[11px] text-brand-orange hover:underline cursor-pointer bg-transparent border-none disabled:opacity-50">
                  {generatingTax ? 'Generating…' : 'Generate'}
                </button>
              </div>
              {taxReports.length === 0 ? (
                <p className="text-xs text-slate">No tax reports yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {taxReports.map(r => (
                    <div key={r._id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-graphite leading-[1.3] capitalize">{r.period} {r.year}</p>
                        <p className="text-[11px] text-slate mt-0.5">Net {fmt(r.netRevenue)} · Est. tax {fmt(r.estimatedTax)}</p>
                      </div>
                      {r.pdfUrl && (
                        <a href={r.pdfUrl} target="_blank" rel="noreferrer"
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white border border-bone rounded-[6px] text-[11px] font-medium text-slate hover:border-brand-orange/40">
                          PDF
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payouts */}
            {recentPayouts.length > 0 && (
              <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4">
                <p className="text-[13px] font-semibold text-carbon mb-3">Recent Payouts</p>
                <div className="flex flex-col gap-2.5">
                  {recentPayouts.map(p => {
                    const ps = PAYOUT_STATUS_STYLE[p.status];
                    return (
                      <button key={p._id} onClick={() => setSelectedPayoutId(p._id)}
                        className="flex items-center justify-between gap-2 bg-transparent border-none p-0 cursor-pointer text-left">
                        <span className="text-xs text-graphite">{fmt(p.amount)}</span>
                        <span className="px-2 py-[2px] rounded-full text-[10px] font-semibold capitalize" style={{ background: ps.bg, color: ps.color }}>
                          {p.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {methodModal && (
        <PayoutMethodModal storeId={storeId} onClose={() => setMethodModal(false)} onSaved={() => { setMethodModal(false); loadCore(); }} />
      )}
      {editingMethod && (
        <PayoutMethodModal storeId={storeId} editing={editingMethod} onClose={() => setEditingMethod(null)} onSaved={() => { setEditingMethod(null); loadCore(); }} />
      )}
      {payoutModal && (
        <RequestPayoutModal storeId={storeId} availableBalance={dashboard.availableBalance} methods={methods}
          onClose={() => setPayoutModal(false)} onRequested={() => { setPayoutModal(false); loadCore(); loadTransactions(); }} />
      )}
      {scheduleModal && schedule && (
        <ScheduleModal storeId={storeId} schedule={schedule} onClose={() => setScheduleModal(false)} onSaved={() => { setScheduleModal(false); loadCore(); }} />
      )}
      {selectedPayoutId && (
        <PayoutDetailModal storeId={storeId} payoutId={selectedPayoutId} onClose={() => setSelectedPayoutId(null)} />
      )}
      {deletingMethodId && (
        <Modal title="Delete Payout Method" onClose={() => setDeletingMethodId(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingMethodId(null)} disabled={deleteMethodBusy}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteMethod} loading={deleteMethodBusy}>Delete</Button>
          </>
        }>
          <p className="text-[13px] text-charcoal">Delete this payout method? This cannot be undone.</p>
          {deleteMethodError && <p className="text-[12px] text-error mt-2">{deleteMethodError}</p>}
        </Modal>
      )}
    </>
  );
}
