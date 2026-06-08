import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, ArrowRight, Check, Circle } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { newPasswordSchema, type NewPasswordFormData } from '@/utils/validation/schemas';
import { AuthContext } from '@/api/auth';
import type { CSSProperties } from 'react';

const C = {
  orange: '#D97757', carbon: '#141413', charcoal: '#2C2A28',
  slate: '#8C8A82', bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
  error: '#C13030', errorBg: '#FDEAEA',
  warning: '#C08B1E',
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
const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 20,
  padding: '36px 40px', width: '100%', maxWidth: 440,
  border: `1px solid ${C.bone}`,
};

function getStrength(password: string) {
  if (!password) return { score: 0, label: '', color: C.bone };
  let score = 0;
  if (password.length >= 8)         score++;
  if (/[A-Z]/.test(password))       score++;
  if (/[0-9]/.test(password))       score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12)        score++;
  if (score <= 1) return { score, label: 'Weak',   color: C.error   };
  if (score <= 2) return { score, label: 'Fair',   color: C.warning };
  if (score <= 3) return { score, label: 'Good',   color: C.orange  };
  return              { score, label: 'Strong', color: C.success };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.slate, fontFamily: FONT }}>Password strength</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: FONT }}>{label}</span>
      </div>
      <div style={{ height: 4, background: C.bone, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (score / 4) * 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {([
          [password.length >= 8,           'At least 8 characters'],
          [/[A-Z]/.test(password),         'One uppercase letter'],
          [/[0-9]/.test(password),         'One number'],
          [/[^A-Za-z0-9]/.test(password),  'One special character'],
        ] as [boolean, string][]).map(([met, req]) => (
          <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: met ? C.success : C.slate, display: 'flex' }}>{met ? <Check size={12} /> : <Circle size={12} />}</span>
            <span style={{ fontSize: 11, color: met ? C.success : C.slate, fontFamily: FONT }}>{req}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({ label, placeholder, value, onChange, onBlur, error }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} onBlur={onBlur}
          style={{ ...inputStyle, paddingRight: 42, borderColor: error ? C.error : C.bone }}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.slate, padding: 0, display: 'flex' }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{error}</p>}
    </div>
  );
}

export function NewPasswordPage() {
  const navigate       = useNavigate();
  usePageTitle('New Password');
  const resetPassword  = useResetPassword();
  const [otp, setOtp]         = useState('');
  const [otpError, setOtpError] = useState('');

  const ctx       = AuthContext.get();
  const userEmail = ctx?.email ?? '';

  const { values, errors, setValue, blur, handleSubmit } = useForm(
    newPasswordSchema,
    { password: '', confirmPassword: '' },
    {
      onSubmit: async (data: NewPasswordFormData) => {
        if (!otp || otp.length < 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
        setOtpError('');
        await resetPassword.execute(otp, data.password);
      },
    },
  );

  const passwordsMatch = values.password === values.confirmPassword && values.confirmPassword !== '';

  if (resetPassword.success) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', fontFamily: FONT }}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
            Password updated!
          </h1>
          <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
            Your password has been changed. You can now sign in.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
            Sign In Now <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', fontFamily: FONT }}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
          Reset your password
        </h1>
        {userEmail && (
          <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the code sent to <strong style={{ color: C.carbon }}>{userEmail}</strong>
          </p>
        )}

        {/* OTP */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Verification Code</label>
          <input
            type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            style={{
              ...inputStyle, textAlign: 'center', borderColor: otpError ? C.error : otp.length === 6 ? C.success : C.bone,
              letterSpacing: otp ? '0.3em' : 0, fontWeight: otp ? 700 : 400, fontSize: otp ? 18 : 13,
            }}
          />
          {otpError && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{otpError}</p>}
          {otp.length === 6 && !otpError && (
            <p style={{ fontSize: 11, color: C.success, marginTop: 5, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={11} /> Code entered
            </p>
          )}
        </div>

        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <PasswordInput label="New Password" placeholder="Enter new password"
            value={values.password} onChange={v => setValue('password', v)}
            onBlur={blur('password')} error={errors.password} />
          <StrengthBar password={values.password} />
        </div>

        {/* Confirm */}
        <div style={{ marginBottom: 20 }}>
          <PasswordInput label="Confirm Password" placeholder="Confirm new password"
            value={values.confirmPassword} onChange={v => setValue('confirmPassword', v)}
            onBlur={blur('confirmPassword')} error={errors.confirmPassword} />
          {values.confirmPassword && (
            <p style={{ fontSize: 11, marginTop: 5, fontFamily: FONT, color: passwordsMatch ? C.success : C.error }}>
              {passwordsMatch ? <><Check size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Passwords match</> : <>✗ Passwords do not match</>}
            </p>
          )}
        </div>

        {resetPassword.error && (
          <div style={{ background: C.errorBg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: C.error, fontFamily: FONT }}>
            {resetPassword.error}
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={resetPassword.loading}>
          {resetPassword.loading
            ? 'Resetting...'
            : <span>Reset Password <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>
      </div>
    </div>
  );
}
