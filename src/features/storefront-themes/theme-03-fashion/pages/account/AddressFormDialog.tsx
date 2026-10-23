import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { apiAddAddress, apiUpdateAddress, type Address, type AddressPayload } from '@/api/services/address';
import { localizedCountryOptions } from '../../../core/countryOptions';
import { EMPTY_ADDRESS_FORM, addressToForm, validateAddressForm } from '../../../accountUi';
import { fashionTheme as t } from '../../theme.config';
import { Dialog } from '../../ui/Dialog';
import { Field, TextInput, SelectInput, PillButton, Notice } from '../../ui/primitives';


/** Add / edit an address (same fields + validation as the checkout's new-address form). */
export function AddressFormDialog({ address, isFirst, onClose, onSaved }: { address?: Address; isFirst: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AddressPayload>(() => (address ? addressToForm(address) : { ...EMPTY_ADDRESS_FORM, isDefault: isFirst }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<AddressPayload>) => setForm(f => ({ ...f, ...patch }));

  async function submit() {
    const invalid = validateAddressForm(form);
    if (invalid) { setError(invalid); return; }
    setSaving(true); setError('');
    try {
      if (address) await apiUpdateAddress(address._id, form); else await apiAddAddress(form);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('checkout.err.address', 'Failed to save address.'));
      setSaving(false);
    }
  }

  return (
    <Dialog title={address ? ts('addresses.editTitle', 'Edit address') : ts('addresses.add', 'Add a new address')} onClose={onClose}
      footer={<><PillButton variant="outline" className="flex-1" onClick={onClose}>{ts('common.cancel', 'Cancel')}</PillButton><PillButton className="flex-1" loading={saving} onClick={submit}>{address ? ts('addresses.updateBtn', 'Update address') : ts('addresses.addBtn', 'Add address')}</PillButton></>}>
      <form onSubmit={e => { e.preventDefault(); void submit(); }} className="grid gap-4 sm:grid-cols-2">
        <Field label={ts('checkout.recipientName', 'Recipient name')} required>{p => <TextInput {...p} autoComplete="name" value={form.recipientName} onChange={e => set({ recipientName: e.target.value })} />}</Field>
        <Field label={ts('checkout.phoneNumber', 'Phone number')} required>{p => <TextInput {...p} type="tel" autoComplete="tel" value={form.phoneNumber} onChange={e => set({ phoneNumber: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><Field label={ts('checkout.addressLine1', 'Address line 1')} required>{p => <TextInput {...p} autoComplete="address-line1" value={form.addressLine1} onChange={e => set({ addressLine1: e.target.value })} />}</Field></div>
        <div className="sm:col-span-2"><Field label={ts('checkout.addressLine2', 'Address line 2 (optional)')}>{p => <TextInput {...p} autoComplete="address-line2" value={form.addressLine2 ?? ''} onChange={e => set({ addressLine2: e.target.value })} />}</Field></div>
        <Field label={ts('checkout.city', 'City')} required>{p => <TextInput {...p} autoComplete="address-level2" value={form.city} onChange={e => set({ city: e.target.value })} />}</Field>
        <Field label={ts('pg.state_province', 'State / province')} required>{p => <TextInput {...p} autoComplete="address-level1" value={form.state} onChange={e => set({ state: e.target.value })} />}</Field>
        <Field label={ts('checkout.zip', 'Zip code')} required>{p => <TextInput {...p} autoComplete="postal-code" value={form.zipCode} onChange={e => set({ zipCode: e.target.value })} />}</Field>
        <Field label={ts('addresses.country', 'Country')} required>
          {p => <SelectInput {...p} autoComplete="country-name" value={form.country ?? ''} onChange={e => set({ country: e.target.value })}>
            <option value="" disabled>{ts('checkout.selectCountry', 'Select country')}</option>
            {localizedCountryOptions().map(c => <option key={c.code} value={c.name}>{c.label}</option>)}
          </SelectInput>}
        </Field>
        {!address?.isDefault && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
            <input type="checkbox" checked={!!form.isDefault} onChange={e => set({ isDefault: e.target.checked })} style={{ accentColor: t.colors.accent, width: 18, height: 18 }} />
            {ts('addresses.setDefaultAddr', 'Set as default address')}
          </label>
        )}
        {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}
        <button type="submit" className="sr-only">{ts('pg.save', 'Save')}</button>
      </form>
    </Dialog>
  );
}
