import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { Button }      from '@/components/comman/ui/Button';
import { Input }       from '@/components/comman/ui/Input';
import { RadioButton } from '@/components/comman/ui/RadioButton';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { Eye, EyeOff, ArrowRight, ShoppingBag, Store, TrendingUp } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer',  description: 'Browse and purchase from the marketplace' },
  { value: 'seller', label: 'Seller', description: 'Create a store and sell to thousands of buyers' },
];

const HIGHLIGHTS = [
  { Icon: ShoppingBag, text: 'Shop from thousands of independent sellers' },
  { Icon: Store,       text: 'Launch your own store in minutes' },
  { Icon: TrendingUp,  text: 'Grow your business with built-in analytics' },
];

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
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241F1B] to-brand-deep-orange"
      heading={<>Start selling or<br />shopping today</>}
      subtext="Create your free Solvexo account and join a growing community of buyers and creators."
      highlights={HIGHLIGHTS}
      maxWidth="max-w-[520px]"
    >
      <div className="lg:hidden flex justify-center mb-5">
        <SolvexoLogo size={32} />
      </div>

      <h1 className="text-[22px] font-bold text-carbon mb-1 text-center lg:text-left">
        Create your account
      </h1>
      <p className="text-[13px] text-slate mb-5 text-center lg:text-left">
        Join Solvexo — Commerce. Solved.
      </p>

      {/* Role */}
      <div className="mb-4">
        <label className="block text-[13px] font-semibold text-carbon mb-[8px]">
          I want to
        </label>
        <RadioButton
          name="role" options={ROLE_OPTIONS}
          value={values.role} onChange={val => setValue('role', val)} layout="row"
        />
      </div>

      <div className="h-px bg-bone mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Full Name" placeholder="Enter your name" autoComplete="name"
          value={values.name} onChange={set('name')} onBlur={blur('name')}
          error={errors.name}
        />
        <Input
          label="Email Address" type="email" placeholder="you@example.com" autoComplete="email"
          value={values.email} onChange={set('email')} onBlur={blur('email')}
          error={errors.email}
        />
        <Input
          label="Phone Number" type="tel" placeholder="e.g. 03001234567" autoComplete="tel"
          value={values.phone} onChange={set('phone')} onBlur={blur('phone')}
          error={errors.phone}
        />
        <Input
          label="Address" placeholder="Enter your address" autoComplete="street-address"
          value={values.address} onChange={set('address')} onBlur={blur('address')}
          error={errors.address}
        />
        <div className="sm:col-span-2">
          <Input
            label="Password" type={showPass ? 'text' : 'password'} placeholder="Create a password" autoComplete="new-password"
            value={values.password} onChange={set('password')} onBlur={blur('password')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            error={errors.password}
            rightIcon={
              <button type="button" onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>
      </div>

      <Button variant="primary" size="md" fullWidth onClick={handleSubmit} disabled={register.loading} className="mt-4">
        {register.loading
          ? 'Creating account...'
          : values.role === 'seller'
            ? <span className="inline-flex items-center gap-1">Create Seller Account <ArrowRight size={14} /></span>
            : <span className="inline-flex items-center gap-1">Create Buyer Account <ArrowRight size={14} /></span>}
      </Button>

      {register.error && (
        <p className="text-[13px] text-error text-center mt-3">
          {register.error}
        </p>
      )}

      <p className="text-center text-[12px] text-slate mt-4">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')}
          className="text-brand-orange font-semibold text-[12px] bg-transparent border-none cursor-pointer hover:opacity-75">
          Sign In
        </button>
      </p>
    </AuthSplitLayout>
  );
}
