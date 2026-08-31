import { useState, useEffect, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext, apiResendOtp, apiForgotPassword, type AppRole } from '@/api/services/auth';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useToast } from '@/contexts/ToastContext';
import { AtelierButton } from '../components/AtelierButton';
import { atelierTheme as t } from '../theme.config';

const OTP_LENGTH = 6;

function AtelierOtpInput({ values, onChange }: { values: string[]; onChange: (i: number, v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    onChange(i, val);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    pasted.split('').forEach((ch, i) => onChange(i, ch));
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div role="group" aria-label={`${OTP_LENGTH}-digit verification code`} className="flex gap-2.5 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
          type="text" inputMode="numeric" maxLength={1} value={val}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="atelier-otp-digit"
          style={{
            width: '44px', height: '52px', textAlign: 'center', fontSize: '19px', fontWeight: 600,
            fontFamily: t.fonts.display, color: t.colors.ink, outline: 'none',
            border: `1px solid ${val ? t.colors.ink : t.colors.border}`,
            background: val ? t.colors.bgAlt : '#FFFFFF',
          }}
        />
      ))}
    </div>
  );
}

function ResendTimer({ email, storeId, isForgot }: { email: string; storeId?: string; isForgot: boolean }) {
  const toast = useToast();
  const [seconds, setSeconds] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [resendKey, setResendKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(timer); setCanResend(true); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendKey]);

  const handleResend = async () => {
    setSending(true); setError('');
    try {
      // Registration's resend-otp endpoint 400s with "User already verified"
      // for a forgot-password OTP — that account is, correctly, already
      // verified. Forgot-password's own endpoint already regenerates and
      // re-emails a fresh code, so it doubles as the real "resend" here —
      // same pattern the apex marketplace's ResendTimer already uses.
      if (isForgot) await apiForgotPassword({ email, role: 'user' as AppRole, storeId });
      else await apiResendOtp({ email, role: 'user', storeId });
      setSeconds(59); setCanResend(false); setResendKey(k => k + 1);
      toast.success('Code resent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally { setSending(false); }
  };

  if (canResend) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button" onClick={handleResend} disabled={sending}
          className="cursor-pointer bg-transparent border-0"
          style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 600, color: t.colors.accent }}
        >
          Resend code
        </button>
        {error && <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.danger }}>{error}</p>}
      </div>
    );
  }
  return (
    <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>
      Resend in <span style={{ fontWeight: 600, color: t.colors.ink }}>{seconds}s</span>
    </span>
  );
}

export function AtelierVerifyOtpPage() {
  const isForgot = AuthContext.get()?.flow === 'forgot';
  useStorefrontSeo({ title: isForgot ? 'Verify Identity' : 'Verify Email', noindex: true });
  const { store } = useStorefront();
  const navigate = useNavigate();
  const verifyOtp = useVerifyOtp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const ctx = AuthContext.get();
  const userEmail = ctx?.email ?? '';
  const filled = otp[0] !== '' && otp.every(v => v !== '');

  const handleChange = (i: number, val: string) => {
    const next = [...otp]; next[i] = val; setOtp(next); setError('');
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }

    if (isForgot) {
      // No standalone "verify this reset code" endpoint exists — reset-
      // password only accepts otp+newPassword together in one request (see
      // `useResetPassword`). Carry the code forward instead of re-verifying
      // it here; if it's actually wrong/expired, that surfaces on the next
      // step with a real way back to re-enter it.
      AuthContext.set({ email: userEmail, role: ctx?.role ?? 'user', flow: 'forgot', storeId: ctx?.storeId, otp: code });
      navigate('../new-password');
      return;
    }

    await verifyOtp.execute(code);
    if (verifyOtp.error) setError(verifyOtp.error);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '400px', padding: '72px 20px' }}>
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 600, color: t.colors.ink }}>{isForgot ? 'Verify your identity' : 'Verify your email'}</h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
          {isForgot
            ? <>We sent a 6-digit code to <span style={{ fontWeight: 600, color: t.colors.ink }}>{userEmail || '—'}</span> to confirm it's you before resetting your password.</>
            : <>We sent a 6-digit code to <span style={{ fontWeight: 600, color: t.colors.ink }}>{userEmail || '—'}</span> to finish creating your {store.name} account.</>}
        </p>
      </div>

      <div style={{ border: `1px solid ${t.colors.border}`, padding: '28px' }}>
        <div style={{ marginBottom: '18px' }}>
          <AtelierOtpInput values={otp} onChange={handleChange} />
          {filled && (
            <p className="flex items-center justify-center gap-1" style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.success, marginTop: '10px' }}>
              <Check size={11} /> Code entered
            </p>
          )}
        </div>

        {(error || verifyOtp.error) && (
          <div className="flex items-center gap-2" style={{ marginBottom: '16px', border: `1px solid ${t.colors.danger}`, padding: '10px 14px' }}>
            <AlertCircle size={14} style={{ color: t.colors.danger, flexShrink: 0 }} />
            <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger }}>{error || verifyOtp.error}</span>
          </div>
        )}

        <AtelierButton
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleVerify}
          disabled={otp.join('').length < 6}
          loading={verifyOtp.loading}
        >
          Verify Code
        </AtelierButton>

        <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '20px' }}>
          <span style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Didn't receive it?</span>
          <ResendTimer email={userEmail} storeId={ctx?.storeId} isForgot={isForgot} />
        </div>
      </div>
    </div>
  );
}
