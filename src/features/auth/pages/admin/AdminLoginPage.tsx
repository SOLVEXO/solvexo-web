import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Globe, Smartphone, Share2 } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { apiLogin, TokenStorage } from '@/api/auth';
import type { CSSProperties } from 'react';

// ── Design tokens (same as LoginPage) ──────────────────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  error: '#C13030',
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
const errorStyle: CSSProperties = {
  fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT,
};

const SOCIAL = [
  { Icon: Globe,      label: 'Google',   color: '#4285F4' },
  { Icon: Smartphone, label: 'Apple',    color: '#141413' },
  { Icon: Share2,     label: 'Facebook', color: '#1877F2' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminLoginPage() {
  const navigate = useNavigate();
  usePageTitle('Admin Login');

  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        setApiError('');
        setLoading(true);
        try {
          const res = await apiLogin({
            email:    data.email,
            password: data.password,
            role:     'admin',
          });

          TokenStorage.save(res.data.token.accessToken, res.data.token.refreshToken);
          TokenStorage.saveUser(res.data.user);
          navigate('/admin', { replace: true });
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Invalid admin credentials.');
        } finally {
          setLoading(false);
        }
      },
    },
  );

  return (
    <div style={{
      minHeight: '100vh', background: C.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px', fontFamily: FONT,
    }}>
      <div style={{
        background: C.white, borderRadius: 20,
        padding: '36px 40px', width: '100%', maxWidth: 460,
        border: `1px solid ${C.bone}`,
      }}>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, marginBottom: 4, textAlign: 'center' }}>
          Admin Sign In
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 28, textAlign: 'center' }}>
          Access the Solvexo admin panel
        </p>

        {/* ── Email ───────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            style={{ ...inputStyle, borderColor: errors.email ? C.error : C.bone }}
          />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}
        </div>

        {/* ── Password ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter Your password"
              value={values.password}
              onChange={set('password')}
              onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 42, borderColor: errors.password ? C.error : C.bone }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.slate, padding: 0, display: 'flex',
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p style={errorStyle}>{errors.password}</p>}
        </div>

        {/* ── Forgot password ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              fontSize: 12, color: C.orange, fontWeight: 500,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* ── Sign In button ───────────────────────────────────────────────── */}
        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* API error */}
        {apiError && (
          <div style={{
            background: '#FDEAEA', borderRadius: 8, padding: '10px 14px',
            marginTop: 12, fontSize: 13, color: C.error,
            fontFamily: FONT, textAlign: 'center',
          }}>
            {apiError}
          </div>
        )}

        {/* ── OR divider ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
          <span style={{ fontSize: 12, color: C.slate }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
        </div>

        {/* ── Social buttons ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {SOCIAL.map(({ Icon, label, color }) => (
            <button
              key={label}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '10px 8px', borderRadius: 8, fontSize: 13,
                fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
                background: C.white, border: `1px solid ${C.bone}`,
                color: C.charcoal, transition: 'background 0.15s',
              }}
            >
              <Icon size={16} style={{ color }} />
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
