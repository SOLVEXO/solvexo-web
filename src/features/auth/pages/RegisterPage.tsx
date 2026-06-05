import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button }      from '@/components/ui/Button';
import { RadioButton } from '@/components/ui/RadioButton';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import { apiRegister, AuthContext } from '@/api/auth';
import type { CSSProperties } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  orange:     '#D97757',
  deepOrange: '#B95A3A',
  paleOrange: '#FBECE4',
  carbon:     '#141413',
  charcoal:   '#2C2A28',
  slate:      '#8C8A82',
  bone:       '#E8E6DC',
  cream:      '#FAF9F5',
  white:      '#FFFFFF',
  error:      '#C13030',
};
const FONT = "'Poppins', sans-serif";

// ── Shared input styles ───────────────────────────────────────────────────────
const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${C.bone}`, fontSize: 13, fontFamily: FONT,
  color: C.charcoal, outline: 'none', boxSizing: 'border-box',
  background: C.white, transition: 'border-color 0.15s',
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};

// ── Role options ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  {
    value:       'buyer',
    label:       'Buyer',
    description: 'Browse and purchase from the marketplace',
    // icon:        <ShoppingCart size={20} />,
  },
  {
    value:       'seller',
    label:       'Seller',
    description: 'Create a store and sell to thousands of buyers',
    // icon:        <Store size={20} />,
  },
];

// ── Field wrapper helper ──────────────────────────────────────────────────────
function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');

  const { values, errors, set, setValue, blur, handleSubmit } = useForm(
    registerSchema,
    { name: '', email: '', password: '', phone: '', address: '', role: 'buyer' },
    {
      onSubmit: async (data: RegisterFormData) => {
        setApiError('');
        setLoading(true);
        try {
          const res = await apiRegister({
            name:     data.name,
            email:    data.email,
            password: data.password,
            phone:    data.phone,
            address:  data.address,
            role:     'user',
          });
          AuthContext.set({ email: data.email, role: 'user', userId: res.data.userId, flow: 'register' });
          navigate('/verify-otp');
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
          setLoading(false);
        }
      },
    },
  );

  return (
    <div
      style={{
        minHeight: '100vh', background: C.cream,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 16px', fontFamily: FONT,
      }}
    >

      {/* Card */}
      <div
        style={{
          background: C.white, borderRadius: 20,
          padding: '36px 40px', width: '100%', maxWidth: 500,
          border: `1px solid ${C.bone}`,
        }}
      >
        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, marginBottom: 4, textAlign: 'center' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 28, textAlign: 'center' }}>
          Join Solvexo — Commerce. Solved.
        </p>

        {/* ── Role selector ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{ ...labelStyle, fontSize: 13, fontWeight: 600, color: C.carbon, marginBottom: 10 }}
          >
            I want to
          </label>
          <RadioButton
            name="role"
            options={ROLE_OPTIONS}
            value={values.role}
            onChange={val => setValue('role', val)}
            layout="row"
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.bone, marginBottom: 20 }} />

        {/* ── Full Name ───────────────────────────────────────────────────── */}
        <Field label="Full Name" error={errors.name}>
          <input
            type="text"
            placeholder="Enter Your Name"
            value={values.name}
            onChange={set('name')}
            onBlur={blur('name')}
            style={{ ...inputStyle, borderColor: errors.name ? C.error : C.bone }}
          />
        </Field>

        {/* ── Email ───────────────────────────────────────────────────────── */}
        <Field label="Email Address" error={errors.email}>
          <input
            type="email"
            placeholder="Enter Your Email"
            value={values.email}
            onChange={set('email')}
            onBlur={blur('email')}
            style={{ ...inputStyle, borderColor: errors.email ? C.error : C.bone }}
          />
        </Field>

        {/* ── Phone ───────────────────────────────────────────────────────── */}
        <Field label="Phone Number" error={errors.phone}>
          <input
            type="tel"
            placeholder="Enter Your Phone Number"
            value={values.phone}
            onChange={set('phone')}
            onBlur={blur('phone')}
            style={{ ...inputStyle, borderColor: errors.phone ? C.error : C.bone }}
          />
        </Field>

        {/* ── Address ─────────────────────────────────────────────────────── */}
        <Field label="Address" error={errors.address}>
          <input
            type="text"
            placeholder="Enter Your Address"
            value={values.address}
            onChange={set('address')}
            onBlur={blur('address')}
            style={{ ...inputStyle, borderColor: errors.address ? C.error : C.bone }}
          />
        </Field>

        {/* ── Password ────────────────────────────────────────────────────── */}
        <Field label="Password" error={errors.password}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Create Your Password"
              value={values.password}
              onChange={set('password')}
              onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                ...inputStyle,
                paddingRight: 42,
                borderColor: errors.password ? C.error : C.bone,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.slate, padding: 0, display: 'flex',
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading
            ? 'Creating account...'
            : values.role === 'seller'
              ? <span>Create Seller Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>
              : <span>Create Buyer Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>
        {apiError && (
          <p style={{ fontSize: 13, color: '#C13030', textAlign: 'center', marginTop: 10, marginBottom: 0, fontFamily: "'Poppins', sans-serif" }}>
            {apiError}
          </p>
        )}

        {/* Sign in link */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.slate, marginTop: 20 }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              color: C.orange, fontWeight: 600, fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Sign In 
          </button>
        </p>
      </div>

      {/* Terms */}
      {/* <p style={{ marginTop: 16, fontSize: 11, color: C.slate, textAlign: 'center', maxWidth: 400 }}>
        By creating an account you agree to our{' '}
        <span style={{ color: C.orange, cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: C.orange, cursor: 'pointer' }}>Privacy Policy</span>
      </p> */}
    </div>
  );
}
