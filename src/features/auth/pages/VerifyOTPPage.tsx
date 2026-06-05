import { useState, useRef, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { runSchema, otpSchema } from '@/utils/validation/schemas';
import { apiVerifyOtp, AuthContext, TokenStorage } from '@/api/auth';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
  error: '#C13030', errorBg: '#FDEAEA',
};
const FONT = "'Poppins', sans-serif";

const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 20,
  // boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  padding: '36px 40px', width: '100%', maxWidth: 440,
  border: `1px solid ${C.bone}`,
};

// ── OTP Input Box ─────────────────────────────────────────────────────────────
function OTPInput({ values, onChange }: {
  values: string[];
  onChange: (index: number, value: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    onChange(i, val);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
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
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 52, height: 56, textAlign: 'center',
              fontSize: 22, fontWeight: 700, fontFamily: FONT,
              borderRadius: 10,
              border: `2px solid ${val ? C.orange : C.bone}`,
              background: val ? C.paleOrange : C.white,
              color: C.carbon, outline: 'none',
              transition: 'all 0.15s',
              cursor: 'text',
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

// ── Resend Timer ──────────────────────────────────────────────────────────────
function ResendTimer() {
  const [seconds, setSeconds] = useState(59);
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
      <button
        onClick={() => { setSeconds(59); setCanResend(false); }}
        style={{
          fontSize: 13, color: C.orange, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
        }}
      >
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

// ── Main Component ────────────────────────────────────────────────────────────
export function VerifyOTPPage() {
  const navigate = useNavigate();
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (i: number, val: string) => {
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError('');
  };

  // Get email stored by RegisterPage
  const ctx = AuthContext.get();
  const userEmail = ctx?.email ?? '';

  const handleVerify = async () => {
    const code = otp.join('');
    const errs = runSchema(otpSchema, { otp: code });
    if (errs.otp) { setError(errs.otp); return; }
    if (!userEmail) { setError('Session expired. Please register again.'); return; }

    setLoading(true);
    try {
      const res = await apiVerifyOtp({ email: userEmail, role: 'user', otp: code });
      // Save tokens + user
      TokenStorage.save(res.data.token.accessToken, res.data.token.refreshToken);
      TokenStorage.saveUser(res.data.user);
      AuthContext.clear();
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px', fontFamily: FONT,
    }}>
      {/* Logo */}
      {/* <div style={{ marginBottom: 32 }}>
        <SolvexoLogo size={36} />
      </div> */}

      <div style={cardStyle}>
        {/* Icon */}
        {/* <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: C.paleOrange, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 26, margin: '0 auto 20px',
        }}>
          📱
        </div> */}

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
          Verify your email
        </h1>
        <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 4, lineHeight: 1.6 }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.carbon, textAlign: 'center', marginBottom: 28 }}>
          {userEmail || '—'}
        </p>

        {/* OTP boxes */}
        <div style={{ marginBottom: 20 }}>
          <OTPInput values={otp} onChange={handleChange} />
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: C.errorBg, borderRadius: 8, padding: '10px 14px',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={14} style={{ color: C.error, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.error }}>{error}</span>
          </div>
        )}

        {/* Verify button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleVerify}
          disabled={otp.join('').length < 6}
        >
          {loading ? 'Verifying...' : <span>Verify Code <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>

        {/* Resend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <span style={{ fontSize: 13, color: C.slate }}>Didn't receive it?</span>
          <ResendTimer />
        </div>

        {/* Change email */}
        {/* <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              fontSize: 12, color: C.slate, background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ← Change email address
          </button>
        </div> */}
      </div>
    </div>
  );
}
