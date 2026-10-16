import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthContext } from '@/api/services/auth';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PillButton, Field, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';
import { PasswordInput } from './auth/PasswordInput';
import { useStoreResetPassword } from '../../core/auth/useStoreResetPassword';

/** `/new-password`: last step of password reset. Needs the code carried in `AuthContext` from /verify-otp, otherwise goes back to /forgot-password. */
export function FashionNewPasswordPage() {
  useStorefrontSeo({ title: 'Reset password', noindex: true });
  const navigate = useNavigate();
  const { store } = useStorefront();
  const reset = useStoreResetPassword();
  const otp = AuthContext.get()?.otp ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');

  if (!otp && !reset.success) return <Navigate to="/forgot-password" replace />;

  if (reset.success) {
    return (
      <AuthShell title="Password" accent="updated" subtitle={`You can now sign back in to ${store.name} with your new password.`}>
        <div className="mb-6 grid place-items-center"><span className="grid size-14 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><CheckCircle2 size={28} style={{ color: t.colors.success }} aria-hidden /></span></div>
        <PillButton full onClick={() => navigate('/login')}>Sign in</PillButton>
      </AuthShell>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setFormError('Passwords do not match.'); return; }
    await reset.execute(otp, password);
  };
  const error = formError || reset.error;

  return (
    <AuthShell title="Choose a new" accent="password" subtitle="Almost done. Set a new password to finish resetting your account.">
      {error && (
        <div className="mb-5"><Notice tone="error" action={reset.error ? <button type="button" onClick={() => navigate('/verify-otp')} className="cursor-pointer border-0 bg-transparent text-sm font-semibold underline">Re-enter code</button> : undefined}>{error}</Notice></div>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="New password" hint="At least 8 characters." required>{p => <PasswordInput {...p} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />}</Field>
        <Field label="Confirm password" required>{p => <PasswordInput {...p} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />}</Field>
        <PillButton type="submit" full loading={reset.loading}>Reset password</PillButton>
      </form>
    </AuthShell>
  );
}
