import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useRegister } from '@/hooks/auth/useRegister';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaInput, novaLabel } from '../components/novaFormStyles';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own sign-up — creates an account scoped to THIS store
 *  (`Store.storeId`), same real flow as `AtelierRegisterPage`. */
export function NovaRegisterPage() {
  useStorefrontSeo({ title: 'Create Account', noindex: true });
  const { store } = useStorefront();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect')) ?? '/';
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.execute({ name, email, password, phone, address, role: 'user', storeId: store.storeId });
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '400px', padding: '72px 20px' }}>
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>Create your {store.name} account</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
          Track orders, save your details, and check out faster.
        </p>
      </div>

      {register.error && (
        <div className="flex items-center gap-2" style={{ marginBottom: '16px', border: `1.5px solid ${t.colors.danger}`, borderRadius: t.radius.sm, padding: '10px 14px' }}>
          <AlertCircle size={14} style={{ color: t.colors.danger, flexShrink: 0 }} />
          <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger }}>{register.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '28px' }}>
        <div>
          <label htmlFor="nova-register-name" style={novaLabel}>Full Name</label>
          <input id="nova-register-name" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} style={novaInput} />
        </div>
        <div>
          <label htmlFor="nova-register-email" style={novaLabel}>Email</label>
          <input id="nova-register-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={novaInput} />
        </div>
        <div>
          <label htmlFor="nova-register-phone" style={novaLabel}>Phone Number</label>
          <input id="nova-register-phone" required autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} style={novaInput} />
        </div>
        <div>
          <label htmlFor="nova-register-address" style={novaLabel}>Address</label>
          <input id="nova-register-address" required autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} style={novaInput} />
        </div>
        <div>
          <label htmlFor="nova-register-password" style={novaLabel}>Password</label>
          <div className="relative">
            <input
              id="nova-register-password"
              type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
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
        <NovaButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} loading={register.loading}>
          Create Account
        </NovaButton>
      </form>

      <p className="text-center" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '18px' }}>
        Already have an account?{' '}
        <a href={`login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} style={{ color: t.colors.accent, fontWeight: 700, textDecoration: 'none' }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
