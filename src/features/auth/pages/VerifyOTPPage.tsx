import { useState, useRef, type KeyboardEvent } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { Button } from '@/components/comman/ui/Button';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext } from '@/api/commerce/auth';

function OTPInput({ values, onChange }: { values: string[]; onChange: (i: number, v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    onChange(i, val);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => onChange(i, ch));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const filled = values[0] !== '' && values.every(v => v !== '');

  return (
    <div>
      <div className="flex gap-[10px] justify-center mb-2">
        {values.map((val, i) => (
          <input key={i}
            ref={el => { refs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={[
              'w-[52px] h-14 text-center text-[22px] font-bold rounded-[10px] border-2 text-carbon outline-none transition-all duration-150 cursor-text',
              val ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white',
            ].join(' ')}
          />
        ))}
      </div>
      {filled && (
        <p className="text-center text-[11px] text-success flex items-center justify-center gap-1">
          <Check size={11} /> Code entered — click Verify to continue
        </p>
      )}
    </div>
  );
}

function ResendTimer() {
  const [seconds,   setSeconds]   = useState(59);
  const [canResend, setCanResend] = useState(false);

  useState(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  });

  if (canResend) {
    return (
      <button onClick={() => { setSeconds(59); setCanResend(false); }}
        className="text-[13px] text-brand-orange font-semibold bg-transparent border-none cursor-pointer">
        Resend code
      </button>
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

  const ctx       = AuthContext.get();
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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[440px] border border-bone">
        <h1 className="text-[22px] font-bold text-carbon text-center mb-2">
          Verify your email
        </h1>
        <p className="text-[13px] text-slate text-center mb-1 leading-[1.6]">
          We sent a 6-digit verification code to
        </p>
        <p className="text-[14px] font-semibold text-carbon text-center mb-7">
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

        <Button variant="primary" size="lg" fullWidth onClick={handleVerify} disabled={otp.join('').length < 6 || verifyOtp.loading}>
          {verifyOtp.loading ? 'Verifying...' : <span>Verify Code <ArrowRight size={14} className="inline align-middle ml-1" /></span>}
        </Button>

        <div className="flex items-center justify-center gap-[6px] mt-5">
          <span className="text-[13px] text-slate">Didn't receive it?</span>
          <ResendTimer />
        </div>
      </div>
    </div>
  );
}
