import { useState, useRef, type KeyboardEvent } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { AuthContext } from '@/api/commerce/auth';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', carbon: '#141413', charcoal: '#2C2A28',
  slate: '#8C8A82', bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  paleOrange: '#FBECE4', success: '#2D8A4E',
  error: '#C13030', errorBg: '#FDEAEA',
};
const FONT = "'Poppins', sans-serif";

const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 20,
  padding: '36px 40px', width: '100%', maxWidth: 440,
  border: `1px solid ${C.bone}`,
};

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
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
        {values.map((val, i) => (
          <input key={i}
            ref={el => { refs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 52, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
              fontFamily: FONT, borderRadius: 10,
              border: `2px solid ${val ? C.orange : C.bone}`,
              background: val ? C.paleOrange : C.white,
              color: C.carbon, outline: 'none', transition: 'all 0.15s', cursor: 'text',
            }}
          />
        ))}
      </div>
      {filled && (
        <p style={{ textAlign: 'center', fontSize: 11, color: C.success, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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
        style={{ fontSize: 13, color: C.orange, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
        Resend code
      </button>
    );
  }
  return (
    <span style={{ fontSize: 13, color: C.slate }}>
      Resend in <span style={{ fontWeight: 600, color: C.charcoal }}>{seconds}s</span>
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
    <div style={{
      minHeight: '100vh', background: C.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px', fontFamily: FONT,
    }}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
          Verify your email
        </h1>
        <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 4, lineHeight: 1.6 }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.carbon, textAlign: 'center', marginBottom: 28 }}>
          {userEmail || '—'}
        </p>

        <div style={{ marginBottom: 20 }}>
          <OTPInput values={otp} onChange={handleChange} />
        </div>

        {(error || verifyOtp.error) && (
          <div style={{ background: C.errorBg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: C.error, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.error }}>{error || verifyOtp.error}</span>
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={handleVerify} disabled={otp.join('').length < 6 || verifyOtp.loading}>
          {verifyOtp.loading ? 'Verifying...' : <span>Verify Code <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <span style={{ fontSize: 13, color: C.slate }}>Didn't receive it?</span>
          <ResendTimer />
        </div>
      </div>
    </div>
  );
}
