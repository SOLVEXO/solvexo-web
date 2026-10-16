import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AuthContext } from '@/api/services/auth';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { PillButton, Notice } from '../ui/primitives';
import { AuthShell } from '../ui/AuthShell';
import { OtpBoxes } from './auth/OtpBoxes';
import { ResendTimer } from './auth/ResendTimer';
import { OTP_LENGTH } from '../../core/auth/authLinks';

/** `/verify-otp`: the code step of registration (verifies + signs in) and of password reset (carries the code to /new-password). Needs the email stored in `AuthContext` by the previous step. */
export function FashionVerifyOtpPage() {
  const ctx = AuthContext.get();
  const isForgot = ctx?.flow === 'forgot';
  const email = ctx?.email ?? '';
  useStorefrontSeo({ title: isForgot ? 'Verify identity' : 'Verify email', noindex: true });
  const { store } = useStorefront();
  const navigate = useNavigate();
  const verify = useVerifyOtp();
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const code = otp.join('');
  const complete = code.length === OTP_LENGTH;
  const shownError = error || verify.error;

  if (!email) {
    return (
      <AuthShell title="Details" accent="missing" subtitle={`We could not find your verification details. Please ${isForgot ? 'restart the password reset' : 'register or sign in'} again.`}>
        <PillButton full onClick={() => navigate(isForgot ? '/forgot-password' : '/register')}>{isForgot ? 'Reset password' : 'Create account'}</PillButton>
      </AuthShell>
    );
  }

  const change = (i: number, v: string) => { setOtp(prev => { const next = [...prev]; next[i] = v; return next; }); setError(''); };

  const submit = async () => {
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }
    if (isForgot) {
      // There is no standalone "check this reset code" endpoint: the code is sent together with the new password on the next step.
      AuthContext.set({ email, role: ctx?.role ?? 'user', flow: 'forgot', storeId: ctx?.storeId, otp: code });
      navigate('/new-password');
      return;
    }
    await verify.execute(code);
  };

  return (
    <AuthShell title={isForgot ? 'Verify your' : 'Check your'} accent={isForgot ? 'identity' : 'email'}
      subtitle={<>We sent a 6-digit code to <b style={{ color: t.colors.ink }}>{email}</b> {isForgot ? 'to confirm it is you before resetting your password.' : `to finish creating your ${store.name} account.`}</>}>
      <form onSubmit={e => { e.preventDefault(); void submit(); }} className="flex flex-col gap-5">
        <OtpBoxes values={otp} onChange={change} invalid={!!shownError} />
        <p aria-live="polite" className="m-0 flex min-h-5 items-center justify-center gap-1 text-[13px]" style={{ color: t.colors.success }}>{complete && !shownError && <><Check size={13} aria-hidden /> Code entered</>}</p>
        {shownError && <Notice tone="error">{shownError}</Notice>}
        <PillButton type="submit" full disabled={!complete} loading={verify.loading}>Verify code</PillButton>
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: t.colors.inkMuted }}>Did not receive it? <ResendTimer email={email} storeId={ctx?.storeId} isForgot={isForgot} /></div>
      </form>
    </AuthShell>
  );
}
