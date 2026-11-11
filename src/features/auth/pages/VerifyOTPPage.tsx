import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { Button } from '@/components/comman/ui/Button';
import { OTPInput } from '@/components/comman/ui/OTPInput';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext, apiResendOtp, apiForgotPassword, apiVerifyResetOtp, type AppRole } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { Mail, ShieldCheck, KeyRound, Fingerprint } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { motion } from 'motion/react';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { VERIFY_OTP_TEXT } from './VerifyOTPPage.text';
import { formError } from './authPages.text';

const fadeSlide = { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } };

// Text: VERIFY_OTP_TEXT.emailHighlights / identityHighlights (one per icon, same order).
const EMAIL_HIGHLIGHT_ICONS = [Mail, KeyRound, ShieldCheck];
const IDENTITY_HIGHLIGHT_ICONS = [Fingerprint, KeyRound, ShieldCheck];

function ResendTimer({ email, role, isIdentity }: { email: string; role: AppRole; isIdentity: boolean }) {
  const toast = useToast();
  const t = useSiteText(VERIFY_OTP_TEXT);
  const [seconds,    setSeconds]    = useState(59);
  const [canResend,  setCanResend]  = useState(false);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState('');
  // Bumped on every successful resend so the countdown effect below re-runs
  // and starts a fresh interval — previously the interval was only ever
  // created once (inside a useState initializer, whose cleanup was never
  // actually invoked since only useEffect cleanup functions are), so after
  // the first countdown finished, resetting `seconds` to 59 froze the
  // display forever with no running timer to count it back down.
  const [resendKey,  setResendKey]  = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendKey]);

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      // Registration's resend-otp endpoint 400s with "User already verified"
      // for a forgot-password OTP — that account is, correctly, already
      // verified. Forgot-password's own endpoint already regenerates and
      // re-emails a fresh code, so it doubles as the real "resend" here.
      if (isIdentity) {
        await apiForgotPassword({ email, role });
      } else {
        await apiResendOtp({ email, role });
      }
      setSeconds(59);
      setCanResend(false);
      setResendKey(k => k + 1);
      toast.success(t.codeResent);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.resendFailed);
    } finally {
      setSending(false);
    }
  };

  if (canResend) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button variant="link" size="sm" onClick={handleResend} loading={sending} disabled={sending}>
          {t.resendCode}
        </Button>
        {error && <p className="text-[11px] text-error">{error}</p>}
      </div>
    );
  }
  return (
    <span className="text-[13px] text-slate">
      {t.resendIn} <span className="font-semibold text-charcoal">{t.seconds(seconds)}</span>
    </span>
  );
}

export function VerifyOTPPage() {
  const { pageLang } = useSiteLang();
  const t = useSiteText(VERIFY_OTP_TEXT);
  usePageTitle(t.pageTitle);
  const navigate   = useNavigate();
  const verifyOtp  = useVerifyOtp();
  const [otp, setOtp]     = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  // Only used by the isIdentity (forgot-password) branch below, which calls
  // apiVerifyResetOtp directly instead of the useVerifyOtp hook — needs its
  // own loading flag so the button shows a spinner during that call too.
  const [checkingOtp, setCheckingOtp] = useState(false);

  const ctx        = AuthContext.get();
  const userEmail  = ctx?.email ?? '';
  const userRole   = ctx?.role ?? 'user';
  const isIdentity = ctx?.flow === 'forgot';

  const handleChange = (i: number, val: string) => {
    setOtp(prev => { const next = [...prev]; next[i] = val; return next; }); setError('');
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }

    if (isIdentity) {
      // Reject a wrong/expired code right here via the read-only
      // verify-reset-otp endpoint, instead of silently carrying it forward
      // to the new-password screen and only finding out after the user has
      // already typed (and confirmed) a brand-new password. This call never
      // marks the code used — reset-password still validates the same otp
      // itself once the new password is actually submitted.
      setCheckingOtp(true);
      try {
        await apiVerifyResetOtp({ email: userEmail, role: userRole, otp: code });
        AuthContext.set({ email: userEmail, role: userRole, flow: 'forgot', otp: code });
        navigate('/new-password');
      } catch (err) {
        setError(err instanceof Error ? err.message : t.invalidCode);
      } finally {
        setCheckingOtp(false);
      }
      return;
    }

    await verifyOtp.execute(code);
    if (verifyOtp.error) setError(verifyOtp.error);
  };

  return (
    <AuthSplitLayout
      pageContext="otp"
      heading={isIdentity ? t.identityHeading : t.emailHeading}
      subtext={isIdentity ? t.identitySubtext : t.emailSubtext}
      highlights={isIdentity
        ? t.identityHighlights.map((text, i) => ({ Icon: IDENTITY_HIGHLIGHT_ICONS[i], text }))
        : t.emailHighlights.map((text, i) => ({ Icon: EMAIL_HIGHLIGHT_ICONS[i], text }))}
    >
      <h1 className="text-[22px] font-bold text-carbon text-center mb-2">
        {isIdentity ? t.identityTitle : t.emailTitle}
      </h1>
      <p className="text-[13px] text-slate text-center mb-1 leading-[1.6]">
        {t.sentTo}
      </p>
      <p dir="ltr" className="text-[14px] font-semibold text-carbon text-center mb-6">
        {userEmail || '—'}
      </p>

      {/* Digits are entered left to right in Arabic too. */}
      <div className="mb-5" dir="ltr">
        <OTPInput values={otp} onChange={handleChange} />
      </div>

      {(error || verifyOtp.error) && (
        <motion.div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mb-4 flex items-center gap-2" {...fadeSlide}>
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-[13px] text-error">{formError(error, pageLang) || verifyOtp.error}</span>
        </motion.div>
      )}

      <MagneticButton className="block">
        <Button
          variant="primary" size="lg" fullWidth
          onClick={handleVerify}
          disabled={otp.join('').length < 6 || checkingOtp}
          loading={verifyOtp.loading || checkingOtp}
          iconRight={!verifyOtp.loading && !checkingOtp && <ArrowRight size={14} className="rtl:-scale-x-100" />}
        >
          {t.verifyCode}
        </Button>
      </MagneticButton>

      <div className="flex items-center justify-center gap-[6px] mt-5">
        <span className="text-[13px] text-slate">{t.didntReceive}</span>
        <ResendTimer email={userEmail} role={userRole} isIdentity={isIdentity} />
      </div>
    </AuthSplitLayout>
  );
}
