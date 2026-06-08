import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Button } from '@/components/ui/Button';
import { useForm } from '@/hooks/useForm';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/validation/schemas';
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
const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 20,
  padding: '36px 40px', width: '100%', maxWidth: 440,
  border: `1px solid ${C.bone}`,
};

export function ForgotPasswordPage() {
  const navigate       = useNavigate();
  usePageTitle('Forgot Password');
  const forgotPassword = useForgotPassword();

  const { values, errors, set, blur, handleSubmit } = useForm(
    forgotPasswordSchema,
    { email: '' },
    {
      onSubmit: async (data: ForgotPasswordFormData) => {
        await forgotPassword.execute(data.email);
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
      <div style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 8 }}>
          Forgot your password?
        </h1>
        <p style={{ fontSize: 13, color: C.slate, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
          Enter your email and we'll send you a reset code.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email" placeholder="Enter your email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ ...inputStyle, borderColor: errors.email ? C.error : C.bone }}
          />
          {errors.email && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{errors.email}</p>}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={forgotPassword.loading}>
          {forgotPassword.loading ? 'Sending...' : 'Send Reset Code'}
        </Button>

        {forgotPassword.error && (
          <p style={{ fontSize: 13, color: C.error, textAlign: 'center', marginTop: 10, fontFamily: FONT }}>
            {forgotPassword.error}
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('/login')}
            style={{ fontSize: 12, color: C.slate, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
