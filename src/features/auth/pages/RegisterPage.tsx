import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button }      from '@/components/comman/ui/Button';
import { Input }       from '@/components/comman/ui/Input';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { SocialLoginModal } from '@/components/comman/ui/SocialLoginModal';
import { RoleSegmentedControl } from '@/components/comman/ui/RoleSegmentedControl';
import { SocialLoginRow, type SocialProvider } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ArrowRight, ShoppingBag, Store, TrendingUp, AlertTriangle } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import type { SocialLoginPayload } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MarketplaceMockup, DashboardMockup } from '@/features/auth/components/mockups/AuthMockups';

type Provider = SocialProvider;

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
  const social    = useSocialLogin();
  const [showPass, setShowPass] = useState(false);
  const [socialProvider, setSocialProvider] = useState<Provider | null>(null);

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

  const handleSocialSuccess = useCallback(async (profile: {
    userName: string; email: string; socialId: string; image: string; token: string;
  }) => {
    if (!socialProvider) return;
    const payload: SocialLoginPayload = {
      authProvider: socialProvider,
      socialId:     profile.socialId,
      userName:     profile.userName,
      email:        profile.email,
      image:        profile.image,
      token:        profile.token,
    };
    await social.execute(payload);
    setSocialProvider(null);
  }, [socialProvider, social]);

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241F1B] to-brand-deep-orange"
      heading={values.role === 'seller' ? <>Launch your<br />store today</> : <>Start selling or<br />shopping today</>}
      subtext="Create your free Solvexo account and join a growing community of buyers and creators."
      highlights={HIGHLIGHTS}
      maxWidth="max-w-[520px]"
      visual={values.role === 'seller' ? <DashboardMockup /> : <MarketplaceMockup />}
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
      <RoleSegmentedControl
        label="I want to"
        options={ROLE_OPTIONS}
        value={values.role}
        onChange={val => setValue('role', val)}
        className="mb-4"
      />

      <div className="h-px bg-bone mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Full Name" placeholder="Enter Your Name" autoComplete="name"
          value={values.name} onChange={set('name')} onBlur={blur('name')}
          error={errors.name}
        />
        <Input
          label="Email Address" type="email" placeholder="Enter Your Email Address" autoComplete="email"
          value={values.email} onChange={set('email')} onBlur={blur('email')}
          error={errors.email}
        />
        <Input
          label="Phone Number" type="tel" placeholder="Enter Your Phone Number" autoComplete="tel"
          value={values.phone} onChange={set('phone')} onBlur={blur('phone')}
          error={errors.phone}
        />
        <Input
          label="Address" placeholder="Enter Your Address" autoComplete="street-address"
          value={values.address} onChange={set('address')} onBlur={blur('address')}
          error={errors.address}
        />
        <div className="sm:col-span-2">
          <Input
            label="Password" type={showPass ? 'text' : 'password'} placeholder="Create a Password" autoComplete="new-password"
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

      <Button
        variant="primary" size="md" fullWidth
        onClick={handleSubmit}
        loading={register.loading}
        iconRight={!register.loading && <ArrowRight size={14} />}
        className="mt-4"
      >
        {values.role === 'seller' ? 'Create Seller Account' : 'Create Buyer Account'}
      </Button>

      {(register.error || social.error) && (
        <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{register.error || social.error}</span>
        </div>
      )}

      {/* OR divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-bone" />
        <span className="text-[11px] text-slate">or sign up with</span>
        <div className="flex-1 h-px bg-bone" />
      </div>

      {/* Social buttons */}
      <SocialLoginRow
        onSelect={setSocialProvider}
        disabled={social.loading || register.loading}
        className="mb-4"
      />

      <p className="text-center text-[12px] text-slate mt-2">
        Already have an account?{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/login')} className="font-semibold!">
          Sign In
        </Button>
      </p>

      {socialProvider && (
        <SocialLoginModal
          provider={socialProvider}
          loading={social.loading}
          onClose={() => setSocialProvider(null)}
          onSuccess={handleSocialSuccess}
        />
      )}
    </AuthSplitLayout>
  );
}
