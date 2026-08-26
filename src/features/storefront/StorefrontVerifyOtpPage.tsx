import { useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { Button } from '@/components/comman/ui/Button';
import { OTPInput } from '@/components/comman/ui/OTPInput';
import { AlertTriangle } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext, apiResendOtp } from '@/api/services/auth';
import { useStorefront } from './StorefrontContext';
import { useToast } from '@/contexts/ToastContext';

// Mirrors the apex VerifyOTPPage's registration flow (minus the forgot-
// password branch, which storefront registration never triggers), in the
// same minimal no-branding style as StorefrontLoginPage/RegisterPage.
// `useVerifyOtp` reads the storeId already stashed in AuthContext by
// StorefrontRegisterPage, so the resulting session lands on the correct
// store-scoped account with zero extra plumbing here.
function ResendTimer({ email, role, storeId }: { email: string; role: 'user'; storeId?: string }) {
  const toast = useToast();
  const [seconds, setSeconds] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [resendKey, setResendKey] = useState(0);

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
      await apiResendOtp({ email, role, storeId });
      setSeconds(59);
      setCanResend(false);
      setResendKey(k => k + 1);
      toast.success('Code resent');
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

export function StorefrontVerifyOtpPage() {
  usePageTitle('Verify Email');
  const { store } = useStorefront();
  const verifyOtp = useVerifyOtp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const ctx = AuthContext.get();
  const userEmail = ctx?.email ?? '';

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
    <div className="max-w-[400px] mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-7">
        <p className="text-[20px] font-bold text-carbon">Verify your email</p>
        <p className="text-[13px] text-slate mt-1">
          We sent a 6-digit code to <span className="font-semibold text-charcoal">{userEmail || '—'}</span> to finish creating your {store.name} account.
        </p>
      </div>

      <div className="bg-white border border-bone rounded-2xl p-6">
        <div className="mb-5">
          <OTPInput values={otp} onChange={handleChange} />
        </div>

        {(error || verifyOtp.error) && (
          <div role="alert" className="bg-error-bg rounded-lg px-[14px] py-[10px] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-error shrink-0" />
            <span className="text-[13px] text-error">{error || verifyOtp.error}</span>
          </div>
        )}

        <Button
          variant="primary" fullWidth
          onClick={handleVerify}
          disabled={otp.join('').length < 6}
          loading={verifyOtp.loading}
        >
          Verify Code
        </Button>

        <div className="flex items-center justify-center gap-[6px] mt-5">
          <span className="text-[13px] text-slate">Didn't receive it?</span>
          <ResendTimer email={userEmail} role="user" storeId={ctx?.storeId} />
        </div>
      </div>
    </div>
  );
}
