import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { Button }      from '@/components/ui/Button';
import { RadioButton } from '@/components/ui/RadioButton';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
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
  color: C.charcoal, outline: 'none', boxSizing: 'border-box',
  background: C.white, transition: 'border-color 0.15s',
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer',  description: 'Browse and purchase from the marketplace' },
  { value: 'seller', label: 'Seller', description: 'Create a store and sell to thousands of buyers' },
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: C.error, marginTop: 5, fontFamily: FONT }}>{error}</p>}
    </div>
  );
}

export function RegisterPage() {
  const navigate  = useNavigate();
  usePageTitle('Register');
  const register  = useRegister();
  const [showPass, setShowPass] = useState(false);

  const { values, errors, set, setValue, blur, handleSubmit } = useForm(
    registerSchema,
    { name: '', email: '', password: '', phone: '', address: '', role: 'user' },
    {
      onSubmit: async (data: RegisterFormData) => {
        await register.execute({
          name:     data.name,
          email:    data.email,
          password: data.password,
          phone:    data.phone,
          address:  data.address,
          role:     (data.role === 'seller' ? 'seller' : 'user'),
        });
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
        width: '100%', maxWidth: 500, border: `1px solid ${C.bone}`,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, marginBottom: 4, textAlign: 'center' }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: C.slate, marginBottom: 28, textAlign: 'center' }}>
          Join Solvexo — Commerce. Solved.
        </p>

        {/* Role */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, fontSize: 13, fontWeight: 600, color: C.carbon, marginBottom: 10 }}>
            I want to
          </label>
          <RadioButton
            name="role" options={ROLE_OPTIONS}
            value={values.role} onChange={val => setValue('role', val)} layout="row"
          />
        </div>

        <div style={{ height: 1, background: C.bone, marginBottom: 20 }} />

        <Field label="Full Name" error={errors.name}>
          <input type="text" placeholder="Enter Your Name"
            value={values.name} onChange={set('name')} onBlur={blur('name')}
            style={{ ...inputStyle, borderColor: errors.name ? C.error : C.bone }} />
        </Field>

        <Field label="Email Address" error={errors.email}>
          <input type="email" placeholder="Enter Your Email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            style={{ ...inputStyle, borderColor: errors.email ? C.error : C.bone }} />
        </Field>

        <Field label="Phone Number" error={errors.phone}>
          <input type="tel" placeholder="Enter Your Phone Number"
            value={values.phone} onChange={set('phone')} onBlur={blur('phone')}
            style={{ ...inputStyle, borderColor: errors.phone ? C.error : C.bone }} />
        </Field>

        <Field label="Address" error={errors.address}>
          <input type="text" placeholder="Enter Your Address"
            value={values.address} onChange={set('address')} onBlur={blur('address')}
            style={{ ...inputStyle, borderColor: errors.address ? C.error : C.bone }} />
        </Field>

        <Field label="Password" error={errors.password}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'} placeholder="Create Your Password"
              value={values.password} onChange={set('password')} onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 42, borderColor: errors.password ? C.error : C.bone }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.slate, padding: 0, display: 'flex' }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={register.loading} style={{ marginTop: 4 }}>
          {register.loading
            ? 'Creating account...'
            : values.role === 'seller'
              ? <span>Create Seller Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>
              : <span>Create Buyer Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>}
        </Button>

        {register.error && (
          <p style={{ fontSize: 13, color: C.error, textAlign: 'center', marginTop: 10, fontFamily: FONT }}>
            {register.error}
          </p>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: C.slate, marginTop: 20 }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}
            style={{ color: C.orange, fontWeight: 600, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
