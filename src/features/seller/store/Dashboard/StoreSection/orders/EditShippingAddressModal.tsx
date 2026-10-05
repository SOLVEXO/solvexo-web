import { useState, type ChangeEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Field, Input, Modal } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiUpdateOrderShippingAddress, type OrderShippingAddressPayload } from '@/api/services/orders';
import type { SellerOrderDetailShippingAddress } from '@/api/services/product';

interface Props {
  storeId: string;
  orderId: string;
  address: SellerOrderDetailShippingAddress;
  onClose: () => void;
  onSaved: () => void;
}

export function EditShippingAddressModal({ storeId, orderId, address, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState({
    recipientName: address.recipientName ?? '',
    phoneNumber:   address.phoneNumber ?? '',
    addressLine1:  address.addressLine1 ?? '',
    addressLine2:  address.addressLine2 ?? '',
    city:          address.city ?? '',
    state:         address.state ?? '',
    zipCode:       address.zipCode ?? '',
    country:       (address as { country?: string }).country ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (busy) return;
    const required: (keyof typeof form)[] = ['recipientName', 'phoneNumber', 'addressLine1', 'city', 'state', 'zipCode'];
    const next: typeof errors = {};
    for (const k of required) if (!form[k].trim()) next[k] = 'Required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: OrderShippingAddressPayload = {
      recipientName: form.recipientName.trim(),
      phoneNumber:   form.phoneNumber.trim(),
      addressLine1:  form.addressLine1.trim(),
      city:          form.city.trim(),
      state:         form.state.trim(),
      zipCode:       form.zipCode.trim(),
    };
    if (form.addressLine2.trim()) payload.addressLine2 = form.addressLine2.trim();
    if (form.country.trim()) payload.country = form.country.trim();

    setBusy(true);
    setError('');
    apiUpdateOrderShippingAddress(storeId, orderId, payload)
      .then(() => { toast.success('Shipping address updated'); onSaved(); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to update address.'))
      .finally(() => setBusy(false));
  };

  return (
    <Modal
      title="Edit shipping address"
      width={520}
      onClose={() => { if (!busy) onClose(); }}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} loading={busy} disabled={busy}>Save</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {error && (
          <div role="alert" className="bg-error-bg border border-error-border rounded-lg px-3 py-2 flex items-center gap-2 text-[12.5px] text-error">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        <Field label="Full name" required error={errors.recipientName}><Input value={form.recipientName} onChange={set('recipientName')} disabled={busy} /></Field>
        <Field label="Phone" required error={errors.phoneNumber}><Input value={form.phoneNumber} onChange={set('phoneNumber')} disabled={busy} /></Field>
        <Field label="Address" required error={errors.addressLine1}><Input value={form.addressLine1} onChange={set('addressLine1')} disabled={busy} /></Field>
        <Field label="Apartment, suite, etc."><Input value={form.addressLine2} onChange={set('addressLine2')} disabled={busy} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" required error={errors.city}><Input value={form.city} onChange={set('city')} disabled={busy} /></Field>
          <Field label="State / Province" required error={errors.state}><Input value={form.state} onChange={set('state')} disabled={busy} /></Field>
          <Field label="Postal code" required error={errors.zipCode}><Input value={form.zipCode} onChange={set('zipCode')} disabled={busy} /></Field>
          <Field label="Country"><Input value={form.country} onChange={set('country')} disabled={busy} /></Field>
        </div>
      </div>
    </Modal>
  );
}
