import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
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

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: C.cream,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 16px',
      fontFamily: FONT,
    }}>
      {/* Logo */}
      {/* <div style={{ marginBottom: 32 }}>
        <SolvexoLogo size={36} />
      </div> */}

      {/* Card */}
      <div style={{
        background: C.white, borderRadius: 20,
        padding: '36px 40px', width: '100%', maxWidth: 440,
        border: `1px solid ${C.bone}`,
      }}>
        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, marginBottom: 6, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 28, textAlign: 'center' }}>
          Sign in to your Solvexo account
        </p>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            placeholder="alex@example.com"
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            style={inputStyle}
          />
        </div>

        {/* Forgot password */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
            fontSize: 12, color: C.orange, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT,
          }}>
            Forgot password?
          </button>
        </div>

        {/* Sign in button */}
        <Button variant="primary" size="lg" fullWidth>
          Sign In
        </Button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
          <span style={{ fontSize: 12, color: C.slate }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { icon: '🌐', label: 'Google'   },
            { icon: '🍎', label: 'Apple'    },
            { icon: '📘', label: 'Facebook' },
          ].map(s => (
            <button key={s.label} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '10px 8px', borderRadius: 8, fontSize: 13,
              fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
              background: C.white, border: `1px solid ${C.bone}`,
              color: C.charcoal, transition: 'background 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.slate }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              color: C.orange, fontWeight: 600, fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Start for free →
          </button>
        </p>
      </div>
    </div>
  );
}
