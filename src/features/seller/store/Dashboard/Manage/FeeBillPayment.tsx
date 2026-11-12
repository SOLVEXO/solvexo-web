import { useState } from 'react';
import { Button, Modal } from '@/components/comman/ui';
import { apiReportFeeBillPaid, type FeePayTo, type TransactionFeeBill } from '@/api/services/platformPlans';

const LABELS: Array<[keyof FeePayTo, string]> = [
  ['bankName', 'Bank'], ['accountTitle', 'Account title'], ['accountNumber', 'Account number'], ['iban', 'IBAN'],
  ['jazzcashNumber', 'JazzCash'], ['easypaisaNumber', 'Easypaisa'],
];

/**
 * A transaction-fee bill of a seller with no card on file: says how much to send and where, and lets the seller tell
 * us the transfer was sent. Only the Solvexo team can close the bill, after seeing the money.
 */
export function FeeBillPayment({ storeId, bill, payTo, onReported }: { storeId: string; bill: TransactionFeeBill; payTo: FeePayTo | null; onReported: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = bill.amountUSD + (bill.taxAmountUSD ?? 0);
  const rows = payTo ? LABELS.filter(([k]) => !!payTo[k]) : [];

  async function send() {
    setSaving(true); setError('');
    try {
      await apiReportFeeBillPaid(storeId, bill._id, note.trim() || undefined);
      setOpen(false); setNote('');
      onReported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="basis-full w-full mt-1 rounded-lg bg-warning-bg/60 border border-warning/20 px-3.5 py-3 flex flex-col gap-2">
      <p className="text-[12px] text-warning font-semibold">
        No card on file. Please send ${total.toFixed(2)}{bill.dueAt ? ` by ${new Date(bill.dueAt).toLocaleDateString()}` : ''} by bank transfer.
      </p>
      {rows.length > 0 ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[12px] m-0">
          {rows.map(([k, label]) => (
            <div key={k} className="contents">
              <dt className="text-slate">{label}</dt>
              <dd className="text-charcoal font-medium m-0 break-all">{payTo![k]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-[12px] text-slate">Ask us through Help for the payment details.</p>
      )}
      {payTo?.instructions && <p className="text-[12px] text-slate">{payTo.instructions}</p>}

      {bill.sellerReportedPaidAt ? (
        <p className="text-[12px] text-success">
          You told us on {new Date(bill.sellerReportedPaidAt).toLocaleDateString()} that you paid. We will mark this bill paid once we see the money.
        </p>
      ) : (
        <div>
          <Button size="sm" variant="secondary" onClick={() => { setOpen(true); setError(''); }}>I have paid</Button>
        </div>
      )}

      {open && (
        <Modal
          title="Tell us you paid"
          width={420}
          onClose={() => setOpen(false)}
          footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={send} loading={saving}>Send</Button></>}
        >
          <p className="text-[13px] text-charcoal">We will check our bank and mark the bill paid. This does not close it by itself.</p>
          <label htmlFor="fee-paid-note" className="text-xs font-medium text-graphite mt-3 mb-[5px] block">Transfer reference or note (optional)</label>
          <input
            id="fee-paid-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={300}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white"
          />
          {error && <p role="alert" className="text-[12px] text-error mt-2">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
