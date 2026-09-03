import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaInput, novaLabel } from '../components/novaFormStyles';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own "forgot password" entry point — real backend-wired (the
 *  same `apiForgotPassword`/OTP flow `AtelierForgotPasswordPage` uses).
 *  Deliberately shows the SAME generic success message regardless of
 *  whether the email is a real account (matches the backend's own
 *  account-enumeration protection — see `AuthService.forgotPassword`'s doc
 *  comment) instead of branching the UI on whether the request "succeeded,"
 *  which would otherwise leak that same information back through a
 *  different channel. */
export function NovaForgotPasswordPage() {
  useStorefrontSeo({ title: 'Forgot Password', noindex: true });
  const { store } = useStorefront();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');

  // `execute` navigates to /verify-otp itself on success (matching the
  // backend's account-enumeration protection — it always returns a generic
  // success regardless of whether the email is real, so this page always
  // proceeds to the OTP step too; only a genuine request failure, e.g. a
  // network error, leaves the buyer here with `forgotPassword.error`).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword.execute(email, 'user', store.storeId);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '400px', padding: '72px 20px' }}>
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink }}>Reset your password</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
          Enter the email on your {store.name} account and we'll send you a code to reset your password.
        </p>
      </div>

      {forgotPassword.error && (
        <div className="flex items-center gap-2" style={{ marginBottom: '16px', border: `1.5px solid ${t.colors.danger}`, borderRadius: t.radius.sm, padding: '10px 14px' }}>
          <AlertCircle size={14} style={{ color: t.colors.danger, flexShrink: 0 }} />
          <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger }}>{forgotPassword.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '28px' }}>
        <div>
          <label htmlFor="nova-forgot-email" style={novaLabel}>Email</label>
          <input id="nova-forgot-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={novaInput} />
        </div>
        <NovaButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} loading={forgotPassword.loading}>
          Send Reset Code
        </NovaButton>
      </form>

      <p className="text-center" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '18px' }}>
        <a href="../login" style={{ color: t.colors.accent, fontWeight: 700, textDecoration: 'none' }}>Back to sign in</a>
      </p>
    </div>
  );
}
