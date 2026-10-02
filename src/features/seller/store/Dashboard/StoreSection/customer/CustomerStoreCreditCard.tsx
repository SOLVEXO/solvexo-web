import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import {
  apiGetCustomerStoreCredit, apiAdjustStoreCredit,
  type StoreCreditAccount, type StoreCreditTransaction,
} from '@/api/services/storeCredit';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { currencySymbol, fmt2 } from '@/utils/currency';

const TYPE_LABEL: Record<string, string> = {
  issue: 'Credit issued',
  adjust_credit: 'Credit added',
  adjust_debit: 'Credit removed',
  redeem: 'Used at checkout',
  restore: 'Restored',
  refund_credit: 'Refund to store credit',
  expire: 'Expired',
};
const INCREASE = new Set(['issue', 'adjust_credit', 'restore', 'refund_credit']);
const NOTE_MAX = 300;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  storeId: string;
  customerId: string;
  fallbackCurrency?: string;
  /** Staff need `customers.edit` to credit/debit; viewing needs `customers.view`. */
  canEdit: boolean;
}

/** Customer-detail "Store credit" card: balance, recent ledger (10) and a
 *  Credit / debit modal (signed amount derived from an Add/Remove toggle). */
export function CustomerStoreCreditCard({ storeId, customerId, fallbackCurrency, canEdit }: Props) {
  const toast = useToast();
  const [data, setData] = useState<StoreCreditAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetCustomerStoreCredit(storeId, customerId, { page: 1, limit: 10 })
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(err => { if (!cancelled) { setData(null); setError(err instanceof Error ? err.message : 'Failed to load store credit.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, customerId]);

  useEffect(() => load(), [load]);

  const currency = data?.currency ?? fallbackCurrency;
  const money = (n: number) => `${currencySymbol(currency)}${fmt2(n)}`;

  function openModal() {
    setMode('add'); setAmount(''); setNote(''); setExpiresAt(''); setFormError('');
    setOpen(true);
  }

  async function submit() {
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) { setFormError('Enter an amount greater than 0.'); return; }
    if (mode === 'remove' && data && value > data.balance) { setFormError(`You can remove at most ${money(data.balance)}.`); return; }
    if (note.length > NOTE_MAX) { setFormError(`Note must be ${NOTE_MAX} characters or fewer.`); return; }
    let expiryIso: string | undefined;
    if (mode === 'add' && expiresAt) {
      // End of the chosen day, local time; must be in the future.
      const d = new Date(`${expiresAt}T23:59:59`);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) { setFormError('Expiry date must be in the future.'); return; }
      expiryIso = d.toISOString();
    }
    setBusy(true);
    setFormError('');
    try {
      await apiAdjustStoreCredit(storeId, customerId, {
        amount: mode === 'add' ? value : -value,
        note: note.trim() || undefined,
        expiresAt: expiryIso,
      });
      setOpen(false);
      toast.success(mode === 'add' ? 'Store credit added' : 'Store credit removed');
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update store credit.');
    } finally {
      setBusy(false);
    }
  }

  const items: StoreCreditTransaction[] = data?.transactions.items ?? [];
  const segBtn = (active: boolean) =>
    `flex-1 py-2 text-xs font-semibold border cursor-pointer ${active ? 'bg-carbon text-white border-carbon' : 'bg-white text-charcoal border-bone'}`;
  const inputCls = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border';

  return (
    <div className="mt-4 pt-4 border-t border-[#f0eee6]">
      <div className="flex items-center justify-between mb-[7px]">
        <span className="text-xs font-medium text-graphite flex items-center gap-1.5"><Wallet size={13} /> Store credit</span>
        {canEdit && !loading && !error && (
          <button type="button" onClick={openModal} className="text-[11.5px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer p-0">
            Credit / debit
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          {[0, 1].map(i => <div key={i} className="h-9 rounded-lg bg-cream animate-pulse" />)}
        </div>
      ) : error ? (
        <div role="alert">
          <p className="text-[11px] text-error mb-1">{error}</p>
          <button type="button" onClick={load} className="text-[11.5px] font-semibold text-charcoal underline bg-transparent border-none cursor-pointer p-0">Retry</button>
        </div>
      ) : (
        <>
          <p className="text-[18px] font-bold text-carbon">{money(data?.balance ?? 0)} <span className="text-[11px] font-medium text-slate">{currency}</span></p>
          {data?.nextExpiry && (
            <p className="text-[11px] text-slate mt-0.5">{money(data.nextExpiry.amount)} expires {fmtDate(data.nextExpiry.expiresAt)}</p>
          )}
          <div className="mt-2.5 flex flex-col gap-1">
            {items.length === 0 ? (
              <p className="text-[11.5px] text-slate">No store credit activity yet.</p>
            ) : items.map(tx => {
              const up = INCREASE.has(tx.type);
              return (
                <div key={tx._id} className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg bg-cream">
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-charcoal truncate">{TYPE_LABEL[tx.type] ?? tx.type}</span>
                    {tx.note && <span className="block text-[10.5px] text-slate truncate">{tx.note}</span>}
                    <span className="block text-[10.5px] text-slate">{fmtDate(tx.createdAt)}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`block text-[12px] font-bold ${up ? 'text-charcoal' : 'text-error'}`}>{up ? '+' : '-'}{money(Math.abs(tx.amount))}</span>
                    <span className="block text-[10.5px] text-slate">Bal. {money(tx.balanceAfter)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {open && (
        <Modal
          title="Credit / debit store credit"
          onClose={() => { if (!busy) setOpen(false); }}
          footer={<>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="primary" onClick={submit} loading={busy}>{mode === 'add' ? 'Add credit' : 'Remove credit'}</Button>
          </>}
        >
          {formError && <p role="alert" className="text-[12px] text-error mb-3">{formError}</p>}
          <div className="flex flex-col gap-3">
            <div role="group" aria-label="Action" className="flex">
              <button type="button" aria-pressed={mode === 'add'} onClick={() => setMode('add')} className={`${segBtn(mode === 'add')} rounded-l-lg`}>Add credit</button>
              <button type="button" aria-pressed={mode === 'remove'} onClick={() => setMode('remove')} className={`${segBtn(mode === 'remove')} rounded-r-lg border-l-0`}>Remove credit</button>
            </div>
            <div>
              <label htmlFor="sc-amount" className="text-xs font-medium text-graphite mb-[5px] block">Amount ({currency})</label>
              <input id="sc-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount}
                onChange={e => setAmount(e.target.value)} className={inputCls} />
              {mode === 'remove' && data && <p className="text-[11px] text-slate mt-1">Current balance: {money(data.balance)}</p>}
            </div>
            <div>
              <label htmlFor="sc-note" className="text-xs font-medium text-graphite mb-[5px] block">Note <span className="text-slate font-normal">(optional)</span></label>
              <textarea id="sc-note" rows={2} maxLength={NOTE_MAX} value={note} onChange={e => setNote(e.target.value)} className={`${inputCls} resize-none`} />
              <p className="text-[11px] text-slate mt-1 text-right">{note.length}/{NOTE_MAX}</p>
            </div>
            {mode === 'add' && (
              <div>
                <label htmlFor="sc-expiry" className="text-xs font-medium text-graphite mb-[5px] block">Expiry date <span className="text-slate font-normal">(optional)</span></label>
                <input id="sc-expiry" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
