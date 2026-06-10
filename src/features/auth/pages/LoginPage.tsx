import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Globe, Smartphone, Share2 } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import type { AppRole } from '@/api/commerce/auth';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', carbon: '#141413', charcoal: '#2C2A28',
  slate: '#8C8A82', bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  error: '#C13030',
};
const FONT = "'Poppins', sans-serif";

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${C.bone}`, fontSize: 13, fontFamily: FONT,
  color: C.charcoal, outline: 'none', boxSizing: 'border-box', background: C.white,
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};

function RoleSwitch({ role, onToggle }: { role: AppRole; onToggle: (r: AppRole) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 10, background: '#F0EDE6', padding: 4, gap: 4 }}>
      {(['user', 'seller'] as AppRole[]).map((r) => {
        const active = role === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onToggle(r)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontFamily: FONT,
              fontWeight: active ? 600 : 400, cursor: 'pointer', border: 'none',
              transition: 'all 0.2s', borderRadius: 8,
              background: active ? C.white : 'transparent',
              color: active ? C.carbon : C.slate,
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {r === 'user' ? 'Buyer' : 'Seller'}
          </button>
        );
      })}
    </div>
  );
}

const SOCIAL = [
  { Icon: Globe,       label: 'Google',   color: '#4285F4' },
  { Icon: Smartphone,  label: 'Apple',    color: '#141413' },
  { Icon: Share2,      label: 'Facebook', color: '#1877F2' },
];

export function LoginPage() {
  const navigate   = useNavigate();
  usePageTitle('Login');
  const login      = useLogin();
  const [role, setRole]         = useState<AppRole>('user');
  const [showPass, setShowPass] = useState(false);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        await login.execute({ email: data.email, password: data.password, role });
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
        background: C.white, borderRadius: 20, padding: '36px 40px',
        width: '100%', maxWidth: 460, border: `1px solid ${C.bone}`,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, marginBottom: 4, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 24, textAlign: 'center' }}>
          Sign in to your Solvexo account
        </p>

        {/* Role switch */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>Sign in as</label>
          <RoleSwitch role={role} onToggle={setRole} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email" placeholder="Enter your email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            style={{ ...inputStyle, borderColor: errors.email ? C.error : C.bone }}
          />
          {errors.email && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'} placeholder="Enter your password"
              value={values.password} onChange={set('password')} onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 42, borderColor: errors.password ? C.error : C.bone }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.slate, padding: 0, display: 'flex' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{errors.password}</p>}
        </div>

        {/* Forgot */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={() => navigate('/forgot-password')}
            style={{ fontSize: 12, color: C.orange, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            Forgot password?
          </button>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={login.loading}>
          {login.loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {login.error && (
          <div style={{ background: '#FDEAEA', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, color: C.error, fontFamily: FONT, textAlign: 'center' }}>
            {login.error}
          </div>
        )}

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
          <span style={{ fontSize: 12, color: C.slate }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: C.bone }} />
        </div>

        {/* Social */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {SOCIAL.map(({ Icon, label, color }) => (
            <button key={label}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: FONT, cursor: 'pointer', background: C.white, border: `1px solid ${C.bone}`, color: C.charcoal }}>
              <Icon size={16} style={{ color }} />
              {label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: C.slate, marginTop: 20 }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')}
            style={{ color: C.orange, fontWeight: 600, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
