import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PillButton, Field, TextInput, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';

/** `/forgot-password`. The hook sends the code and moves on to /verify-otp (the backend answers the same for unknown emails). */
export function FashionForgotPasswordPage() {
  useStorefrontSeo({ title: 'Forgot password', noindex: true });
  const { store } = useStorefront();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');

  const submit = (e: FormEvent) => { e.preventDefault(); void forgot.execute(email.trim(), 'user', store.storeId); };

  return (
    <AuthShell title="Reset your" accent="password" subtitle={`Enter the email on your ${store.name} account and we will send you a code.`}
      footer={<Link to="/login" className="font-semibold underline" style={{ color: t.colors.ink }}>Back to sign in</Link>}>
      {forgot.error && <div className="mb-5"><Notice tone="error">{forgot.error}</Notice></div>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email" required>{p => <TextInput {...p} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}</Field>
        <PillButton type="submit" full loading={forgot.loading}>Send reset code</PillButton>
      </form>
    </AuthShell>
  );
}
