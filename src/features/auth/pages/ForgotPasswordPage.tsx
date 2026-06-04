import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { CSSProperties } from 'react';

// ── Design tokens (shared across all auth pages) ──────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
  error: '#C13030', errorBg: '#FDEAEA',
};
const FONT = "'Poppins', sans-serif";

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${C.bone}`, fontSize: 13, fontFamily: FONT,
  color: C.charcoal, outline: 'none', boxSizing: 'border-box',
  background: C.white,
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};
const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 20,
  // boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  padding: '36px 40px', width: '100%', maxWidth: 440,
  border: `1px solid ${C.bone}`,
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSubmitted(true);
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
        {!submitted ? (
          <>
            {/* Icon */}
            {/* <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: C.paleOrange, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 26, margin: '0 auto 20px',
            }}>
              🔑
            </div> */}

            {/* Heading */}
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>

            {/* Email input */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleSubmit}>
              Send Reset Link
            </Button>

            {/* Back to login */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  fontSize: 13, color: C.slate, background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            {/* <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: C.successBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 26, margin: '0 auto 20px',
            }}>
              ✉️
            </div> */}

            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 8, lineHeight: 1.6 }}>
              We sent a password reset link to
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.carbon, textAlign: 'center', marginBottom: 28 }}>
              {email}
            </p>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/verify-otp')}
            >
              Enter Verification Code →
            </Button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: C.slate }}>Didn't receive it? </span>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  fontSize: 12, color: C.orange, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Try again
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  fontSize: 12, color: C.slate, background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
