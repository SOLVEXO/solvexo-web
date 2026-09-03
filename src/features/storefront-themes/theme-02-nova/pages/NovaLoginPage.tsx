import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useLogin } from '@/hooks/auth/useLogin';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaInput, novaLabel } from '../components/novaFormStyles';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own sign-in — a store's own account, no marketplace chrome,
 *  no buyer/seller toggle (a storefront login is always a buyer). Same real
 *  `useLogin` flow as `AtelierLoginPage`, Nova's own rounded-card presentation. */
export function NovaLoginPage() {
  useStorefrontSeo({ title: 'Sign In', noindex: true });
  const { store } = useStorefront();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect')) ?? '/';
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.execute({ email, password, role: 'user', storeId: store.storeId }, redirectTo);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '400px', padding: '72px 20px' }}>
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>Sign in to {store.name}</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
          Track orders, save your details, and check out faster.
        </p>
      </div>

      {login.error && (
        <div className="flex items-center gap-2" style={{ marginBottom: '16px', border: `1.5px solid ${t.colors.danger}`, borderRadius: t.radius.sm, padding: '10px 14px' }}>
          <AlertCircle size={14} style={{ color: t.colors.danger, flexShrink: 0 }} />
          <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger }}>{login.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '28px' }}>
        <div>
          <label htmlFor="nova-login-email" style={novaLabel}>Email</label>
          <input id="nova-login-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={novaInput} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="nova-login-password" style={novaLabel}>Password</label>
            <a href="forgot-password" style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.accent, textDecoration: 'none', fontWeight: 600 }}>
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="nova-login-password"
              type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...novaInput, paddingRight: '40px' }}
            />
            <button
              type="button" onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute cursor-pointer bg-transparent border-0"
              style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: t.colors.inkMuted }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <NovaButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} loading={login.loading}>
          Sign In
        </NovaButton>
      </form>

      <p className="text-center" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '18px' }}>
        New here?{' '}
        <a href={`register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} style={{ color: t.colors.accent, fontWeight: 700, textDecoration: 'none' }}>
          Create an account
        </a>
      </p>
    </div>
  );
}
