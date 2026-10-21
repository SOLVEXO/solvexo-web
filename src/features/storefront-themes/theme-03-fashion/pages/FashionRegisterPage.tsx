import { useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { Link, useSearchParams } from 'react-router-dom';
import { useRegister } from '@/hooks/auth/useRegister';
import { useStorefrontSocialLogin } from '@/hooks/auth/useStorefrontSocialLogin';
import { useDetectedCountry } from '@/hooks/auth/useDetectedCountry';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PhoneField } from '../ui/PhoneField';
import { PillButton, Field, TextInput, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';
import { PasswordInput } from './auth/PasswordInput';
import { SocialSignIn } from './auth/SocialSignIn';
import { withRedirect } from '../../core/auth/authLinks';

/** `/register` (`?redirect=`). Creates an account scoped to THIS store, then continues at /verify-otp. */
export function FashionRegisterPage() {
  useStorefrontSeo({ title: ts('orders.createAccountBtn', 'Create account'), noindex: true });
  const { store } = useStorefront();
  const [params] = useSearchParams();
  const redirectTo = safeRedirectPath(params.get('redirect')) ?? '/';
  const register = useRegister();
  const social = useStorefrontSocialLogin(store.storeId, redirectTo);
  const country = useDetectedCountry();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [phoneError, setPhoneError] = useState('');
  const set = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));
  const error = register.error || social.error;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone) { setPhoneError(ts('pg.enter_your_phone_number_2', 'Enter your phone number.')); return; }
    setPhoneError('');
    void register.execute({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone, address: form.address.trim(), role: 'user', storeId: store.storeId });
  };

  return (
    <AuthShell title={ts('pg.create_your', 'Create your')} accent={ts('pg.word_account', 'account')} subtitle={ts('pg.join_store_to_track_orders_and_check', 'Join {{store}} to track orders and check out faster.', { store: store.name })}
      footer={<>{ts('auth.haveAccount', 'Already have an account?')} <Link to={withRedirect('/login', redirectTo)} className="font-semibold underline" style={{ color: t.colors.ink }}>{ts('auth.signInLink', 'Sign in')}</Link></>}>
      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={ts('checkout.fullName', 'Full name')} required>{p => <TextInput {...p} required autoComplete="name" value={form.name} onChange={e => set({ name: e.target.value })} />}</Field>
        <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={form.email} onChange={e => set({ email: e.target.value })} />}</Field>
        <PhoneField required value={form.phone} onChange={v => set({ phone: v })} defaultCountry={country} error={phoneError} />
        <Field label={ts('auth.address', 'Address')} required>{p => <TextInput {...p} required autoComplete="street-address" value={form.address} onChange={e => set({ address: e.target.value })} />}</Field>
        <Field label={ts('auth.password', 'Password')} required>{p => <PasswordInput {...p} required autoComplete="new-password" value={form.password} onChange={e => set({ password: e.target.value })} />}</Field>
        <PillButton type="submit" full loading={register.loading}>{ts('orders.createAccountBtn', 'Create account')}</PillButton>
      </form>
      <SocialSignIn providers={social.providers} onStart={social.start} loading={social.loading} disabled={register.loading} dividerText="or sign up with" />
    </AuthShell>
  );
}
