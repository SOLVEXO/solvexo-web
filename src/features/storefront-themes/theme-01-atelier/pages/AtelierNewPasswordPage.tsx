import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { AuthContext } from '@/api/services/auth';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { atelierInput, atelierLabel } from '../components/atelierFormStyles';
import { atelierTheme as t } from '../theme.config';

/** The last step of Theme 01's password-recovery flow — real
 *  `apiResetPassword` call (otp + new password together in one request,
 *  matching the backend's actual shape; there's no separate "verify this
 *  code" endpoint). Reached only via the OTP step carrying a code forward
 *  in `AuthContext` — a direct visit/refresh with no code goes back to
 *  Forgot Password instead of showing a form that can only ever fail. */
export function AtelierNewPasswordPage() {
  useStorefrontSeo({ title: 'Reset Password', noindex: true });
  const navigate = useNavigate();
  const { store } = useStorefront();
  const resetPassword = useResetPassword();

  const ctx = AuthContext.get();
  const otp = ctx?.otp ?? '';

  useEffect(() => {
    if (!otp) navigate('forgot-password', { replace: true });
  }, [otp, navigate]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  if (!otp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setFormError('Passwords do not match.'); return; }
    await resetPassword.execute(otp, password);
  };

  if (resetPassword.success) {
    return (
      <div className="mx-auto text-center" style={{ maxWidth: '400px', padding: '96px 20px' }}>
        <div className="flex items-center justify-center mx-auto" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E5EFE8', marginBottom: '20px' }}>
          <CheckCircle2 size={28} style={{ color: t.colors.success }} />
        </div>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '22px', fontWeight: 600, color: t.colors.ink, marginBottom: '8px' }}>Password updated</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, marginBottom: '28px' }}>
          You can now sign back in to {store.name} with your new password.
        </p>
        <AtelierButton onClick={() => navigate('../login')}>Sign In</AtelierButton>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '400px', padding: '72px 20px' }}>
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink }}>Choose a new password</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
          Almost done — set a new password to finish resetting your account.
        </p>
      </div>

      {(formError || resetPassword.error) && (
        <div className="flex flex-col gap-2" style={{ marginBottom: '16px', border: `1px solid ${t.colors.danger}`, padding: '10px 14px' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} style={{ color: t.colors.danger, flexShrink: 0 }} />
            <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger }}>{formError || resetPassword.error}</span>
          </div>
          {resetPassword.error && (
            // The code from the previous step is what's actually being
            // checked here (backend verifies it together with the new
            // password) — if it's wrong/expired, the only way back is to
            // re-enter it, not retry this same form with the same bad code.
            <button
              type="button" onClick={() => navigate('../verify-otp')}
              className="self-start cursor-pointer bg-transparent border-0"
              style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 600, color: t.colors.danger, textDecoration: 'underline' }}
            >
              Re-enter code
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 atelier-form" style={{ border: `1px solid ${t.colors.border}`, padding: '28px' }}>
        <div>
          <label htmlFor="atelier-newpw-password" style={atelierLabel}>New Password</label>
          <div className="relative">
            <input
              id="atelier-newpw-password"
              type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...atelierInput, paddingRight: '40px' }}
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
        <div>
          <label htmlFor="atelier-newpw-confirm" style={atelierLabel}>Confirm Password</label>
          <input
            id="atelier-newpw-confirm"
            type={showPassword ? 'text' : 'password'} required autoComplete="new-password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            style={atelierInput}
          />
        </div>
        <AtelierButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} loading={resetPassword.loading}>
          Reset Password
        </AtelierButton>
      </form>
    </div>
  );
}
