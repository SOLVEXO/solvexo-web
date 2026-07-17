import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { Button } from '@/components/comman/ui/Button';
import { OTPInput } from '@/components/comman/ui/OTPInput';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext, apiResendOtp, type AppRole } from '@/api/services/auth';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { Mail, ShieldCheck, KeyRound, Fingerprint } from 'lucide-react';
import { InboxMockup, IdentityMockup } from '@/features/auth/components/mockups/AuthMockups';

const EMAIL_HIGHLIGHTS = [
  { Icon: Mail,        text: 'Check your inbox for a 6-digit code' },
  { Icon: KeyRound,    text: 'Codes expire after a short window' },
  { Icon: ShieldCheck, text: 'This keeps your account secure' },
];

const IDENTITY_HIGHLIGHTS = [
  { Icon: Fingerprint, text: "We're just confirming it's really you" },
  { Icon: KeyRound,    text: 'Codes expire after a short window' },
  { Icon: ShieldCheck, text: 'Your account stays protected throughout' },
];

function ResendTimer({ email, role }: { email: string; role: AppRole }) {
  const [seconds,   setSeconds]   = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState('');

  useState(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  });

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      await apiResendOtp({ email, role });
      setSeconds(59);
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setSending(false);
    }
  };

  if (canResend) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button variant="link" size="sm" onClick={handleResend} loading={sending} disabled={sending}>
          Resend code
        </Button>
        {error && <p className="text-[11px] text-error">{error}</p>}
      </div>
    );
  }
  return (
    <span className="text-[13px] text-slate">
      Resend in <span className="font-semibold text-charcoal">{seconds}s</span>
    </span>
  );
}

export function VerifyOTPPage() {
  usePageTitle('Verify OTP');
  const verifyOtp  = useVerifyOtp();
  const [otp, setOtp]     = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const ctx        = AuthContext.get();
  const userEmail  = ctx?.email ?? '';
  const userRole   = ctx?.role ?? 'user';
  const isIdentity = ctx?.flow === 'forgot';

  const handleChange = (i: number, val: string) => {
    const next = [...otp]; next[i] = val; setOtp(next); setError('');
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }
    await verifyOtp.execute(code);
    if (verifyOtp.error) setError(verifyOtp.error);
  };

  return (
    <AuthSplitLayout
      heading={isIdentity ? 'Confirm it\'s you.' : 'One last step.'}
      subtext={isIdentity
        ? "Enter the code we sent to confirm your identity before resetting your password."
        : 'Verify your email address to finish setting up your Solvexo account.'}
      highlights={isIdentity ? IDENTITY_HIGHLIGHTS : EMAIL_HIGHLIGHTS}
      visual={isIdentity ? <IdentityMockup /> : <InboxMockup />}
    >
      <div className="lg:hidden flex justify-center mb-6"><SolvexoLogo size={32} /></div>

      <h1 className="text-[22px] font-bold text-carbon text-center mb-2">
        {isIdentity ? 'Verify your identity' : 'Verify your email'}
      </h1>
      <p className="text-[13px] text-slate text-center mb-1 leading-[1.6]">
        We sent a 6-digit verification code to
      </p>
      <p className="text-[14px] font-semibold text-carbon text-center mb-6">
        {userEmail || '—'}
      </p>

      <div className="mb-5">
        <OTPInput values={otp} onChange={handleChange} />
      </div>

      {(error || verifyOtp.error) && (
        <div className="bg-error-bg rounded-lg px-[14px] py-[10px] mb-4 flex items-center gap-2">
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-[13px] text-error">{error || verifyOtp.error}</span>
        </div>
      )}

      <Button
        variant="primary" size="lg" fullWidth
        onClick={handleVerify}
        disabled={otp.join('').length < 6}
        loading={verifyOtp.loading}
        iconRight={!verifyOtp.loading && <ArrowRight size={14} />}
      >
        Verify Code
      </Button>

      <div className="flex items-center justify-center gap-[6px] mt-5">
        <span className="text-[13px] text-slate">Didn't receive it?</span>
        <ResendTimer email={userEmail} role={userRole} />
      </div>
    </AuthSplitLayout>
  );
}
