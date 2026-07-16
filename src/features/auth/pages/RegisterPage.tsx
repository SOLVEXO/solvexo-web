import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button }      from '@/components/comman/ui/Button';
import { Input }       from '@/components/comman/ui/Input';
import { RadioButton } from '@/components/comman/ui/RadioButton';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { SocialLoginModal } from '@/components/comman/ui/SocialLoginModal';
import { Eye, EyeOff, ArrowRight, ShoppingBag, Store, TrendingUp, AlertTriangle } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import type { SocialLoginPayload } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

/* ── SVG brand icons ─────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M14.044 9.52c-.02-2.22 1.815-3.293 1.897-3.348-1.033-1.511-2.638-1.718-3.207-1.736-1.363-.14-2.665.806-3.354.806-.69 0-1.755-.788-2.885-.766-1.482.022-2.853.866-3.614 2.197-1.54 2.674-.395 6.633 1.107 8.8.737 1.062 1.61 2.253 2.758 2.21 1.11-.044 1.527-.714 2.868-.714 1.34 0 1.713.714 2.884.69 1.193-.02 1.946-1.082 2.677-2.147.845-1.23 1.19-2.42 1.208-2.482-.027-.012-2.316-.888-2.339-3.51ZM11.78 3.06c.613-.742 1.026-1.773.912-2.8-.883.035-1.95.587-2.582 1.33-.567.655-1.063 1.703-.93 2.707 1 .077 2.02-.508 2.6-1.237Z" fill="#141413"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <rect width="18" height="18" rx="4" fill="#1877F2"/>
      <path d="M12.25 11.5l.375-2.5H10.25V7.5c0-.694.344-1.25 1.313-1.25H12.75V4.062S11.875 3.75 10.938 3.75c-1.875 0-3.063 1.156-3.063 3.25V9H5.75v2.5H7.875V18h2.375v-6.5h2Z" fill="white"/>
    </svg>
  );
}

type Provider = 'google' | 'facebook' | 'apple';

const SOCIAL: { Icon: () => JSX.Element; label: string; provider: Provider }[] = [
  { Icon: GoogleIcon,   label: 'Google',   provider: 'google'   },
  { Icon: AppleIcon,    label: 'Apple',    provider: 'apple'    },
  { Icon: FacebookIcon, label: 'Facebook', provider: 'facebook' },
];

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
      heading={<>Start selling or<br />shopping today</>}
      subtext="Create your free Solvexo account and join a growing community of buyers and creators."
      highlights={HIGHLIGHTS}
      maxWidth="max-w-[520px]"
      showAppPromo
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
        <label className="block text-[13px] font-semibold text-carbon mb-[8px]">I want to</label>
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

      {/* Social buttons — icon + name */}
      <div className="flex gap-2 mb-4">
        {SOCIAL.map(({ Icon, label, provider }) => (
          <button
            key={provider}
            onClick={() => setSocialProvider(provider)}
            disabled={social.loading || register.loading}
            className="flex-1 flex items-center justify-center gap-[7px] px-3 py-[10px] bg-white border border-bone rounded-xl text-[12px] font-medium text-charcoal hover:bg-[#F8F8F8] cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

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
