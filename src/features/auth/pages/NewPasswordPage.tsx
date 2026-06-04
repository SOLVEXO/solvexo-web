import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
  error: '#C13030', errorBg: '#FDEAEA',
  warning: '#C08B1E', warningBg: '#FEF7E5',
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

// ── Password strength calculator ──────────────────────────────────────────────
function getStrength(password: string): { score: number; label: string; color: string; bg: string } {
  if (!password) return { score: 0, label: '', color: C.bone, bg: C.bone };
  let score = 0;
  if (password.length >= 8)                          score++;
  if (/[A-Z]/.test(password))                        score++;
  if (/[0-9]/.test(password))                        score++;
  if (/[^A-Za-z0-9]/.test(password))                score++;
  if (password.length >= 12)                         score++;

  if (score <= 1) return { score, label: 'Weak',   color: C.error,   bg: C.errorBg   };
  if (score <= 2) return { score, label: 'Fair',   color: C.warning, bg: C.warningBg };
  if (score <= 3) return { score, label: 'Good',   color: C.orange,  bg: C.paleOrange};
  return              { score, label: 'Strong', color: C.success, bg: C.successBg };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  const pct = Math.min(100, (score / 4) * 100);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.slate, fontFamily: FONT }}>Password strength</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: FONT }}>{label}</span>
      </div>
      <div style={{ height: 4, background: C.bone, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 2, transition: 'width 0.3s, background 0.3s',
        }} />
      </div>
      {/* Requirements */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          [password.length >= 8,          'At least 8 characters'],
          [/[A-Z]/.test(password),        'One uppercase letter'],
          [/[0-9]/.test(password),        'One number'],
          [/[^A-Za-z0-9]/.test(password), 'One special character'],
        ].map(([met, req]) => (
          <div key={req as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: met ? C.success : C.slate }}>
              {met ? '✓' : '○'}
            </span>
            <span style={{ fontSize: 11, color: met ? C.success : C.slate, fontFamily: FONT }}>
              {req as string}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Eye toggle ────────────────────────────────────────────────────────────────
function PasswordInput({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: C.slate, padding: 0, lineHeight: 1,
          }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function NewPasswordPage() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  const passwordsMatch = password === confirm && confirm !== '';
  const isReady     = password.length >= 8 && passwordsMatch;

  const handleSubmit = () => {
    if (!password)              { setError('Please enter a new password.');      return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)   { setError('Passwords do not match.');           return; }

    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: C.cream,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 16px', fontFamily: FONT,
      }}>
        {/* <div style={{ marginBottom: 32 }}><SolvexoLogo size={36} /></div> */}
        <div style={cardStyle}>
          {/* <div style={{
            width: 64, height: 64, borderRadius: '50%', background: C.successBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 20px',
          }}>
            ✅
          </div> */}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
            Password updated!
          </h1>
          <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
            Sign In Now →
          </Button>
        </div>
      </div>
    );
  }

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
          width: 56, height: 56, borderRadius: '50%', background: C.paleOrange,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 20px',
        }}>
          🔒
        </div> */}

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
          Create a strong password for your account. Must be at least 8 characters.
        </p>

        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={v => { setPassword(v); setError(''); }}
          />
          <StrengthBar password={password} />
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 20 }}>
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={v => { setConfirm(v); setError(''); }}
          />
          {confirm && (
            <p style={{ fontSize: 11, marginTop: 5, fontFamily: FONT, color: passwordsMatch ? C.success : C.error }}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: C.errorBg, borderRadius: 8, padding: '10px 14px',
            marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 13, color: C.error, fontFamily: FONT }}>{error}</span>
          </div>
        )}

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={!isReady || loading}
        >
          {loading ? 'Updating...' : 'Update Password →'}
        </Button>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
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
      </div>
    </div>
  );
}
