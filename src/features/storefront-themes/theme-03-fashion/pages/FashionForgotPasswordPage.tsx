import { useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PillButton, Field, TextInput, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';
import { WithPageSections } from '../ui/WithPageSections';

/** `/forgot-password`. The hook sends the code and moves on to /verify-otp (the backend answers the same for unknown emails). */
export function FashionForgotPasswordPage() {
  return <WithPageSections pageKey="forgot-password"><FashionForgotPasswordPageContent /></WithPageSections>;
}

function FashionForgotPasswordPageContent() {
  useStorefrontSeo({ title: ts('pg.forgot_password', 'Forgot password'), noindex: true });
  const { store } = useStorefront();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState('');

  const submit = (e: FormEvent) => { e.preventDefault(); void forgot.execute(email.trim(), 'user', store.storeId); };

  return (
    <AuthShell title={ts('h.reset_your_password', 'Reset your *password*')} subtitle={ts('pg.enter_the_email_on_your_store_account', 'Enter the email on your {{store}} account and we will send you a code.', { store: store.name })}
      footer={<Link to="/login" className="font-semibold underline" style={{ color: t.colors.ink }}>{ts('auth.backToSignIn', 'Back to sign in')}</Link>}>
      {forgot.error && <div className="mb-5"><Notice tone="error">{forgot.error}</Notice></div>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}</Field>
        <PillButton type="submit" full loading={forgot.loading}>{ts('pg.send_reset_code', 'Send reset code')}</PillButton>
      </form>
    </AuthShell>
  );
}
