import { useState } from 'react';
import { ts, tsNodes } from '@/utils/tStatic';
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
import { WithPageSections } from '../ui/WithPageSections';

/** `/verify-otp`: the code step of registration (verifies + signs in) and of password reset (carries the code to /new-password). Needs the email stored in `AuthContext` by the previous step. */
export function FashionVerifyOtpPage() {
  return <WithPageSections pageKey="verify-otp"><FashionVerifyOtpPageContent /></WithPageSections>;
}

function FashionVerifyOtpPageContent() {
  const ctx = AuthContext.get();
  const isForgot = ctx?.flow === 'forgot';
  const email = ctx?.email ?? '';
  useStorefrontSeo({ title: isForgot ? ts('pg.verify_identity', 'Verify identity') : ts('pg.verify_email', 'Verify email'), noindex: true });
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
      <AuthShell title={ts('pg.details', 'Details')} accent={ts('pg.word_missing', 'missing')} subtitle={isForgot ? ts('pg.we_could_not_find_your_verification', 'We could not find your verification details. Please restart the password reset again.') : ts('pg.we_could_not_find_your_verification_2', 'We could not find your verification details. Please register or sign in again.')}>
        <PillButton full onClick={() => navigate(isForgot ? '/forgot-password' : '/register')}>{isForgot ? ts('pg.reset_password', 'Reset password') : ts('orders.createAccountBtn', 'Create account')}</PillButton>
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
    <AuthShell title={isForgot ? ts('pg.verify_your', 'Verify your') : ts('pg.check_your', 'Check your')} accent={isForgot ? ts('pg.word_identity', 'identity') : ts('pg.word_email', 'email')}
      subtitle={isForgot
        ? tsNodes('pg.otp_sent_reset', 'We sent a 6-digit code to {{email}} to confirm it is you before resetting your password.', { email: <b style={{ color: t.colors.ink }}>{email}</b> })
        : tsNodes('pg.otp_sent_signup', 'We sent a 6-digit code to {{email}} to finish creating your {{store}} account.', { email: <b style={{ color: t.colors.ink }}>{email}</b> }, { store: store.name })}>
      <form onSubmit={e => { e.preventDefault(); void submit(); }} className="flex flex-col gap-5">
        <OtpBoxes values={otp} onChange={change} invalid={!!shownError} />
        <p aria-live="polite" className="m-0 flex min-h-5 items-center justify-center gap-1 text-[13px]" style={{ color: t.colors.success }}>{complete && !shownError && <><Check size={13} aria-hidden /> {ts('pg.code_entered', 'Code entered')}</>}</p>
        {shownError && <Notice tone="error">{shownError}</Notice>}
        <PillButton type="submit" full disabled={!complete} loading={verify.loading}>{ts('pg.verify_code', 'Verify code')}</PillButton>
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.did_not_receive_it', 'Did not receive it?')} <ResendTimer email={email} storeId={ctx?.storeId} isForgot={isForgot} /></div>
      </form>
    </AuthShell>
  );
}
