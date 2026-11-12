import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { Button, Modal } from '@/components/comman/ui';
import { apiGetPlatformConfig, apiUpdateManualPaymentConfig, type ManualPaymentConfig } from '@/api/services/config/adminConfig';

type Fields = Pick<ManualPaymentConfig, 'bankName' | 'accountTitle' | 'accountNumber' | 'iban' | 'jazzcashNumber' | 'easypaisaNumber' | 'instructions'>;
const EMPTY: Fields = { bankName: '', accountTitle: '', accountNumber: '', iban: '', jazzcashNumber: '', easypaisaNumber: '', instructions: '' };
const FIELDS: Array<[keyof Fields, string, string]> = [
  ['bankName', 'Bank', 'e.g. Meezan Bank'],
  ['accountTitle', 'Account title', 'Name on the account'],
  ['accountNumber', 'Account number', ''],
  ['iban', 'IBAN', ''],
  ['jazzcashNumber', 'JazzCash number', ''],
  ['easypaisaNumber', 'Easypaisa number', ''],
];
const INPUT = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white';

/**
 * Where sellers send a transaction-fee bill that waits for a bank transfer. These are the company's account details
 * (the same ones the platform keeps for its manual bank-transfer option); sellers see them next to the bill.
 */
export function FeePaymentDetailsButton() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Fields>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function openDialog() {
    setOpen(true); setError(''); setLoading(true);
    try {
      const res = await apiGetPlatformConfig();
      const c = res.data.manualPaymentConfig;
      setValues({
        bankName: c?.bankName ?? '', accountTitle: c?.accountTitle ?? '', accountNumber: c?.accountNumber ?? '', iban: c?.iban ?? '',
        jazzcashNumber: c?.jazzcashNumber ?? '', easypaisaNumber: c?.easypaisaNumber ?? '', instructions: c?.instructions ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the payment details.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true); setError('');
    try {
      // Only the account details are sent: the on/off switch and the exchange rate of the manual checkout option stay as they are.
      const payload: Partial<ManualPaymentConfig> = {};
      for (const [k] of FIELDS) payload[k] = values[k]?.trim() ?? '';
      payload.instructions = values.instructions?.trim() ?? '';
      await apiUpdateManualPaymentConfig(payload);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={openDialog}><Landmark size={13} /> Payment details</Button>
      {open && (
        <Modal
          title="Where sellers send fee payments"
          width={480}
          onClose={() => setOpen(false)}
          footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving} disabled={loading}>Save</Button></>}
        >
          <p className="text-[12.5px] text-slate mb-3">Shown to a seller next to a transaction-fee bill that waits for a bank transfer. Leave a line empty to hide it.</p>
          <div className="flex flex-col gap-3">
            {FIELDS.map(([key, label, placeholder]) => (
              <div key={key}>
                <label htmlFor={`fpd-${key}`} className="text-xs font-medium text-graphite mb-[5px] block">{label}</label>
                <input id={`fpd-${key}`} value={values[key] ?? ''} placeholder={placeholder} disabled={loading} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} className={INPUT} />
              </div>
            ))}
            <div>
              <label htmlFor="fpd-instructions" className="text-xs font-medium text-graphite mb-[5px] block">Instructions (optional)</label>
              <textarea id="fpd-instructions" rows={3} value={values.instructions ?? ''} disabled={loading} onChange={e => setValues(v => ({ ...v, instructions: e.target.value }))} className={`${INPUT} resize-none`} />
            </div>
          </div>
          {error && <p role="alert" className="text-[12px] text-error mt-2">{error}</p>}
        </Modal>
      )}
    </>
  );
}
