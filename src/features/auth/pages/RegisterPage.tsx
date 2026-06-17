import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { Button }      from '@/components/ui/Button';
import { RadioButton } from '@/components/ui/RadioButton';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer',  description: 'Browse and purchase from the marketplace' },
  { value: 'seller', label: 'Seller', description: 'Create a store and sell to thousands of buyers' },
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] font-medium text-charcoal mb-[6px]">{label}</label>
      {children}
      {error && <p className="text-[11px] text-error mt-[5px]">{error}</p>}
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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-[20px] px-10 py-9 w-full max-w-[500px] border border-bone">
        <h1 className="text-2xl font-bold text-carbon mb-1 text-center">
          Create your account
        </h1>
        <p className="text-[13px] text-slate mb-7 text-center">
          Join Solvexo — Commerce. Solved.
        </p>

        {/* Role */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-carbon mb-[10px]">
            I want to
          </label>
          <RadioButton
            name="role" options={ROLE_OPTIONS}
            value={values.role} onChange={val => setValue('role', val)} layout="row"
          />
        </div>

        <div className="h-px bg-bone mb-5" />

        <Field label="Full Name" error={errors.name}>
          <input type="text" placeholder="Enter Your Name"
            value={values.name} onChange={set('name')} onBlur={blur('name')}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white transition-[border-color] duration-150',
              errors.name ? 'border-error' : 'border-bone',
            ].join(' ')} />
        </Field>

        <Field label="Email Address" error={errors.email}>
          <input type="email" placeholder="Enter Your Email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white transition-[border-color] duration-150',
              errors.email ? 'border-error' : 'border-bone',
            ].join(' ')} />
        </Field>

        <Field label="Phone Number" error={errors.phone}>
          <input type="tel" placeholder="Enter Your Phone Number"
            value={values.phone} onChange={set('phone')} onBlur={blur('phone')}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white transition-[border-color] duration-150',
              errors.phone ? 'border-error' : 'border-bone',
            ].join(' ')} />
        </Field>

        <Field label="Address" error={errors.address}>
          <input type="text" placeholder="Enter Your Address"
            value={values.address} onChange={set('address')} onBlur={blur('address')}
            className={[
              'w-full px-3 py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white transition-[border-color] duration-150',
              errors.address ? 'border-error' : 'border-bone',
            ].join(' ')} />
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} placeholder="Create Your Password"
              value={values.password} onChange={set('password')} onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className={[
                'w-full px-3 pr-[42px] py-[10px] rounded-lg border text-[13px] text-charcoal outline-none box-border bg-white transition-[border-color] duration-150',
                errors.password ? 'border-error' : 'border-bone',
              ].join(' ')}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate p-0 flex">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={register.loading} className="mt-1">
          {register.loading
            ? 'Creating account...'
            : values.role === 'seller'
              ? <span>Create Seller Account <ArrowRight size={14} className="inline align-middle ml-1" /></span>
              : <span>Create Buyer Account <ArrowRight size={14} className="inline align-middle ml-1" /></span>}
        </Button>

        {register.error && (
          <p className="text-[13px] text-error text-center mt-[10px]">
            {register.error}
          </p>
        )}

        <p className="text-center text-[12px] text-slate mt-5">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}
            className="text-brand-orange font-semibold text-[12px] bg-transparent border-none cursor-pointer">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
