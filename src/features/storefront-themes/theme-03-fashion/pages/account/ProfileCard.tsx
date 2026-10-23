import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { Check } from 'lucide-react';
import { useEditProfile } from '@/hooks/auth/useEditProfile';
import type { ProfileData } from '@/api/services/auth';
import { Card, Field, TextInput, PillButton, Notice, SectionHeading } from '../../ui/primitives';
import { fashionTheme as t } from '../../theme.config';

/** Edit name / phone / address (the email is fixed). Mounted only once the profile is loaded, so the form starts from it. */
export function ProfileCard({ profile }: { profile: ProfileData }) {
  const { execute, loading, error, success } = useEditProfile();
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  return (
    <Card>
      <SectionHeading>{ts('account.profile', 'Profile')}</SectionHeading>
      <form onSubmit={e => { e.preventDefault(); void execute({ name: name.trim(), phone: phone.trim(), address: address.trim() }); }} className="grid gap-4 sm:grid-cols-2">
        <Field label={ts('checkout.fullName', 'Full name')}>{p => <TextInput {...p} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />}</Field>
        <Field label={ts('auth.email', 'Email')}>{p => <TextInput {...p} type="email" dir="ltr" value={profile.email ?? ''} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />}</Field>
        <Field label={ts('checkout.phoneNumber', 'Phone number')}>{p => <TextInput {...p} type="tel" dir="ltr" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} />}</Field>
        <Field label={ts('auth.address', 'Address')}>{p => <TextInput {...p} autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} />}</Field>
        {error && <div className="sm:col-span-2"><Notice tone="error">{error}</Notice></div>}
        <div className="flex items-center gap-3 sm:col-span-2">
          <PillButton type="submit" loading={loading}>{ts('pg.save_changes', 'Save changes')}</PillButton>
          <span aria-live="polite" className="flex items-center gap-1 text-sm font-medium" style={{ color: t.colors.success }}>{success && <><Check size={15} aria-hidden /> {ts('account.saved', 'Saved')}</>}</span>
        </div>
      </form>
    </Card>
  );
}
