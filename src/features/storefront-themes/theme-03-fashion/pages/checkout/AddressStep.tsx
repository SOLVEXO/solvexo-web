import { useState } from 'react';
import { Plus } from 'lucide-react';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import type { AddressPayload } from '@/api/services/address';
import { fashionTheme as t } from '../../theme.config';
import { ErrorState, Field, Notice, PillButton, SelectInput, SkeletonBlock, TextInput } from '../../ui/primitives';
import { RadioRow, StepCard, TextLinkButton } from './CheckoutParts';
import { validateAddress, type AddressErrors } from '../../../core/checkout/checkoutMath';
import { EMPTY_ADDRESS, type useAddressBook } from '../../../core/checkout/useAddressBook';

type Book = ReturnType<typeof useAddressBook>;

function AddressForm({ book }: { book: Book }) {
  const [form, setForm] = useState<AddressPayload>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<AddressErrors>({});
  const set = <K extends keyof AddressPayload>(key: K, value: AddressPayload[K]) => setForm(f => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAddress(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move keyboard / screen-reader focus to the first field that needs fixing.
      const formEl = e.currentTarget;
      requestAnimationFrame(() => formEl.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (await book.save({ ...form, addressLine2: form.addressLine2?.trim() ?? '' })) setForm(EMPTY_ADDRESS);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label="New delivery address">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.recipientName}>
          {p => <TextInput {...p} autoComplete="name" value={form.recipientName} onChange={e => set('recipientName', e.target.value)} invalid={!!errors.recipientName} />}
        </Field>
        <Field label="Phone" required error={errors.phoneNumber}>
          {p => <TextInput {...p} type="tel" inputMode="tel" autoComplete="tel" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} invalid={!!errors.phoneNumber} />}
        </Field>
      </div>
      <Field label="Country" required error={errors.country}>
        {p => (
          <SelectInput {...p} autoComplete="country-name" value={form.country ?? ''} onChange={e => set('country', e.target.value)} invalid={!!errors.country}>
            <option value="" disabled>Select a country</option>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
          </SelectInput>
        )}
      </Field>
      <Field label="Address" required error={errors.addressLine1}>
        {p => <TextInput {...p} autoComplete="address-line1" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} invalid={!!errors.addressLine1} />}
      </Field>
      <Field label="Apartment, suite, etc. (optional)">
        {p => <TextInput {...p} autoComplete="address-line2" value={form.addressLine2 ?? ''} onChange={e => set('addressLine2', e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" required error={errors.city}>
          {p => <TextInput {...p} autoComplete="address-level2" value={form.city} onChange={e => set('city', e.target.value)} invalid={!!errors.city} />}
        </Field>
        <Field label="State / province" required error={errors.state}>
          {p => <TextInput {...p} autoComplete="address-level1" value={form.state} onChange={e => set('state', e.target.value)} invalid={!!errors.state} />}
        </Field>
        <Field label="Postal code" required error={errors.zipCode}>
          {p => <TextInput {...p} autoComplete="postal-code" value={form.zipCode} onChange={e => set('zipCode', e.target.value)} invalid={!!errors.zipCode} />}
        </Field>
      </div>
      {book.saveError && <Notice tone="error">{book.saveError}</Notice>}
      <div className="flex flex-wrap items-center gap-4">
        <PillButton type="submit" loading={book.saving}>Save address</PillButton>
        {book.canCancelForm && <TextLinkButton onClick={book.closeForm} disabled={book.saving}>Cancel</TextLinkButton>}
      </div>
    </form>
  );
}

interface Props { step: number; book: Book; pickup: boolean }

export function AddressStep({ step, book, pickup }: Props) {
  const done = pickup || (!!book.selected && !book.showForm);
  let body;
  if (pickup) {
    body = <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>No delivery address needed - you will collect this order at the pickup location chosen below.</p>;
  } else if (book.loading) {
    body = <SkeletonBlock h={72} rows={2} />;
  } else if (book.showForm) {
    body = (
      <div className="flex flex-col gap-4">
        {book.error && <Notice tone="error" action={<TextLinkButton onClick={book.retry}>Retry</TextLinkButton>}>We could not load your saved addresses. You can still add a new one.</Notice>}
        <AddressForm book={book} />
      </div>
    );
  } else if (book.error) {
    body = <ErrorState message="We could not load your saved addresses." onRetry={book.retry} />;
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Saved addresses" className="flex flex-col gap-3">
          {book.list.map(a => (
            <RadioRow key={a._id} name="delivery-address" checked={book.selected?._id === a._id} onChange={() => book.select(a._id)} label={`${a.recipientName}, ${a.addressLine1}, ${a.city}`}>
              <p className="m-0 text-sm font-medium">{a.recipientName} <span style={{ color: t.colors.inkMuted, fontWeight: 400 }}>- {a.phoneNumber}</span></p>
              <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>
                {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} {a.zipCode}{a.country ? `, ${a.country}` : ''}
              </p>
            </RadioRow>
          ))}
        </div>
        {book.selected && !book.selected.country && (
          <Notice tone="error">This address has no country, so delivery options cannot be matched. Add it again with a country.</Notice>
        )}
        <div>
          <button type="button" onClick={book.openForm} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-medium" style={{ color: t.colors.ink }}>
            <Plus size={15} aria-hidden /> Add a new address
          </button>
        </div>
      </div>
    );
  }
  return <StepCard step={step} title="Delivery address" done={done}>{body}</StepCard>;
}
