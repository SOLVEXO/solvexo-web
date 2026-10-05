import { useState } from 'react';
import { Modal, Button } from '@/components/comman/ui';
import { apiAddAddress, apiUpdateAddress, type Address, type AddressPayload } from '@/api/services/address';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { EMPTY_ADDRESS_FORM, addressToForm, validateAddressForm } from './accountUi';

const field = 'w-full border border-bone rounded-lg px-3 py-2 text-[13px] text-charcoal outline-none box-border focus:border-brand-orange bg-white';

/** Add / edit an address. Same fields + validation as the checkout's new-address form. */
export function AddressFormModal({ address, isFirst, onClose, onSaved }: {
  address?: Address; isFirst: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<AddressPayload>(() =>
    address ? addressToForm(address) : { ...EMPTY_ADDRESS_FORM, isDefault: isFirst });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<AddressPayload>) => setForm(f => ({ ...f, ...patch }));

  async function submit() {
    const invalid = validateAddressForm(form);
    if (invalid) { setError(invalid); return; }
    setSaving(true);
    setError('');
    try {
      if (address) await apiUpdateAddress(address._id, form);
      else await apiAddAddress(form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={address ? 'Edit address' : 'Add a new address'}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button onClick={submit} loading={saving} fullWidth>{address ? 'Update address' : 'Add address'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input className={field} aria-label="Recipient name" placeholder="Recipient name" value={form.recipientName} onChange={e => set({ recipientName: e.target.value })} />
          <input className={field} aria-label="Phone number" placeholder="Phone number" value={form.phoneNumber} onChange={e => set({ phoneNumber: e.target.value })} />
        </div>
        <input className={field} aria-label="Address line 1" placeholder="Address line 1" value={form.addressLine1} onChange={e => set({ addressLine1: e.target.value })} />
        <input className={field} aria-label="Address line 2" placeholder="Address line 2 (optional)" value={form.addressLine2 ?? ''} onChange={e => set({ addressLine2: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input className={field} aria-label="City" placeholder="City" value={form.city} onChange={e => set({ city: e.target.value })} />
          <input className={field} aria-label="State or province" placeholder="State/Province" value={form.state} onChange={e => set({ state: e.target.value })} />
          <input className={field} aria-label="Zip code" placeholder="Zip code" value={form.zipCode} onChange={e => set({ zipCode: e.target.value })} />
        </div>
        <select className={field} aria-label="Country" value={form.country ?? ''} onChange={e => set({ country: e.target.value })}>
          <option value="" disabled>Select country</option>
          {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
        </select>
        {!address?.isDefault && (
          <label className="flex items-center gap-2 text-[12px] text-slate cursor-pointer">
            <input type="checkbox" checked={!!form.isDefault} onChange={e => set({ isDefault: e.target.checked })} />
            Set as default address
          </label>
        )}
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

/** Generic confirm dialog that runs an async action and shows its error in place. */
export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    try { await onConfirm(); } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} fullWidth>Cancel</Button>
          <Button onClick={run} loading={busy} fullWidth>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-[13px] text-charcoal">{message}</p>
      {error && <p role="alert" className="text-[12px] text-error mt-3">{error}</p>}
    </Modal>
  );
}
