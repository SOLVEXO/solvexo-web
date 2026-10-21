import { useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { Link, useSearchParams } from 'react-router-dom';
import { useLogin } from '@/hooks/auth/useLogin';
import { useStorefrontSocialLogin } from '@/hooks/auth/useStorefrontSocialLogin';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PillButton, Field, TextInput, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';
import { PasswordInput } from './auth/PasswordInput';
import { SocialSignIn } from './auth/SocialSignIn';
import { withRedirect } from '../../core/auth/authLinks';

/** `/login` (`?redirect=` return path, `?social_code=` / `?social_error=` come back from Google/Facebook). Always a buyer of THIS store. */
export function FashionLoginPage() {
  useStorefrontSeo({ title: ts('auth.signInLink', 'Sign in'), noindex: true });
  const { store } = useStorefront();
  const [params] = useSearchParams();
  const redirectTo = safeRedirectPath(params.get('redirect')) ?? '/';
  const login = useLogin();
  const social = useStorefrontSocialLogin(store.storeId, redirectTo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const error = login.error || social.error;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void login.execute({ email: email.trim(), password, role: 'user', storeId: store.storeId }, redirectTo);
  };

  return (
    <AuthShell title={ts('pg.welcome', 'Welcome')} accent={ts('pg.word_back', 'back')} subtitle={ts('pg.track_orders_save_your_details_and', 'Track orders, save your details and check out faster.')}
      footer={<>{ts('auth.newHere', 'New here?')} <Link to={withRedirect('/register', redirectTo)} className="font-semibold underline" style={{ color: t.colors.ink }}>{ts('auth.createAnAccount', 'Create an account')}</Link></>}>
      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
        <Field label={ts('auth.email', 'Email')} required>{p => <TextInput {...p} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />}</Field>
        <Field label={ts('auth.password', 'Password')} required>{p => <PasswordInput {...p} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />}</Field>
        <div className="-mt-1 text-right text-sm"><Link to="/forgot-password" className="font-medium underline" style={{ color: t.colors.inkMuted }}>{ts('auth.forgotPassword', 'Forgot password?')}</Link></div>
        <PillButton type="submit" full loading={login.loading}>{ts('auth.signInLink', 'Sign in')}</PillButton>
      </form>
      <SocialSignIn providers={social.providers} onStart={social.start} loading={social.loading} disabled={login.loading} dividerText="or" />
    </AuthShell>
  );
}
