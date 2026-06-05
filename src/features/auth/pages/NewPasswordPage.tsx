import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { newPasswordSchema, type NewPasswordFormData } from '@/utils/validation/schemas';
import { apiResetPassword, AuthContext } from '@/api/auth';
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
  label, placeholder, value, onChange, onBlur, error,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
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
          onBlur={onBlur}
          style={{ ...inputStyle, paddingRight: 42, borderColor: error ? C.error : C.bone }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.slate, padding: 0, display: 'flex',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{error}</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function NewPasswordPage() {
  const navigate = useNavigate();
  usePageTitle('New Password');
  const [success,   setSuccess]  = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [otp,       setOtp]      = useState('');      // 6-digit OTP from email
  const [otpError,  setOtpError] = useState('');
  const [apiError,  setApiError] = useState('');

  // Email stored by ForgotPasswordPage
  const ctx       = AuthContext.get();
  const userEmail = ctx?.email ?? '';

  const { values, errors, setValue, blur, handleSubmit } = useForm(
    newPasswordSchema,
    { password: '', confirmPassword: '' },
    {
      onSubmit: async (data: NewPasswordFormData) => {
        // Validate OTP locally first
        if (!otp || otp.length < 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
        if (!userEmail) { setApiError('Session expired. Please start again.'); return; }

        setApiError('');
        setOtpError('');
        setLoading(true);
        try {
          // Single API call: POST auth/reset-password with email+role+otp+newPassword
          await apiResetPassword({
            email:       userEmail,
            role:        'user',
            otp,
            newPassword: data.password,
          });
          AuthContext.clear();
          setSuccess(true);
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
        } finally {
          setLoading(false);
        }
      },
    },
  );

  const passwordsMatch = values.password === values.confirmPassword && values.confirmPassword !== '';

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
            Sign In Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
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
          Reset your password
        </h1>
        {userEmail && (
          <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the 6-digit code sent to <strong style={{ color: C.carbon }}>{userEmail}</strong>
          </p>
        )}

        {/* OTP input — single text field (6 digits) */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            style={{
              ...inputStyle,
              letterSpacing: otp ? '0.3em' : 0,
              fontWeight:    otp ? 700 : 400,
              fontSize:      otp ? 18 : 13,
              textAlign:     'center',
              borderColor: otpError ? C.error : otp.length === 6 ? C.success : C.bone,
            }}
          />
          {otpError && (
            <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{otpError}</p>
          )}
          {otp.length === 6 && !otpError && (
            <p style={{ fontSize: 11, color: C.success, marginTop: 5, fontFamily: FONT }}>✓ Code entered</p>
          )}
        </div>

        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            value={values.password}
            onChange={v => setValue('password', v)}
            onBlur={blur('password')}
            error={errors.password}
          />
          <StrengthBar password={values.password} />
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 20 }}>
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm new password"
            value={values.confirmPassword}
            onChange={v => setValue('confirmPassword', v)}
            onBlur={blur('confirmPassword')}
            error={errors.confirmPassword}
          />
          {values.confirmPassword && (
            <p style={{ fontSize: 11, marginTop: 5, fontFamily: FONT, color: passwordsMatch ? C.success : C.error }}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div style={{
            background: C.errorBg, borderRadius: 8, padding: '10px 14px',
            marginBottom: 16, fontSize: 13, color: C.error, fontFamily: FONT,
          }}>
            {apiError}
          </div>
        )}

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? 'Resetting...'
            : <span>Reset Password <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>

        {/* Back */}
        {/* <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              fontSize: 12, color: C.slate, background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ← Back to Sign In
          </button>
        </div> */}
      </div>
    </div>
  );
}
