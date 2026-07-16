import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { SocialLoginModal } from '@/components/comman/ui/SocialLoginModal';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import type { AppRole, SocialLoginPayload } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

/* ── SVG brand icons (inline — no external deps) ─────────────────────────── */
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

const HIGHLIGHTS = [
  { Icon: Sparkles,    text: 'Curated marketplace of independent creators' },
  { Icon: Zap,         text: 'Fast checkout, real-time order tracking' },
  { Icon: ShieldCheck, text: 'Secure payments on every purchase' },
];

export function LoginPage() {
  const navigate   = useNavigate();
  usePageTitle('Login');
  const login      = useLogin();
  const social     = useSocialLogin();
  const [role, setRole]           = useState<AppRole>('user');
  const [showPass, setShowPass]   = useState(false);
  const [socialProvider, setSocialProvider] = useState<Provider | null>(null);

  // Stable role toggle — doesn't reset form or trigger re-mount of hook states
  const handleRoleToggle = useCallback((r: AppRole) => setRole(r), []);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        await login.execute({ email: data.email, password: data.password, role });
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
      heading={<>Commerce.<br />Solved.</>}
      subtext="Join thousands of buyers and sellers building their business on Solvexo's marketplace."
      highlights={HIGHLIGHTS}
      showAppPromo
    >
      <div className="lg:hidden flex justify-center mb-4">
        <SolvexoLogo size={30} />
      </div>

      <h1 className="text-[20px] font-bold text-carbon mb-1 text-center lg:text-left">
        Welcome back
      </h1>
      <p className="text-[12.5px] text-slate mb-4 text-center lg:text-left">
        Sign in to your Solvexo account to continue
      </p>

      {/* Role switch — pure visual, no state reset */}
      <div className="mb-3">
        <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Sign in as</label>
        <div className="flex rounded-xl bg-cream p-1 gap-1 border border-bone">
          {(['user', 'seller'] as AppRole[]).map((r) => {
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleToggle(r)}
                aria-pressed={active}
                className={[
                  'flex-1 py-[9px] text-[13px] cursor-pointer border-none transition-all duration-200 rounded-[10px]',
                  active ? 'font-semibold bg-white text-carbon shadow-sm' : 'font-normal bg-transparent text-slate hover:text-charcoal',
                ].join(' ')}
              >
                {r === 'user' ? 'Buyer' : 'Seller'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          id="login-email"
          label="Email Address"
          type="email" placeholder="you@example.com" autoComplete="email"
          value={values.email} onChange={set('email')} onBlur={blur('email')}
          error={errors.email}
        />
        <div>
          <Input
            id="login-password"
            label="Password"
            type={showPass ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password"
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
          <div className="flex justify-end mt-2">
            <Button variant="link" size="sm" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </Button>
          </div>
        </div>
      </div>

      <Button variant="primary" size="md" fullWidth onClick={handleSubmit} loading={login.loading} className="mt-4">
        Sign In
      </Button>

      {(login.error || social.error) && (
        <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{login.error || social.error}</span>
        </div>
      )}

      {/* OR divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-bone" />
        <span className="text-[11px] text-slate">or continue with</span>
        <div className="flex-1 h-px bg-bone" />
      </div>

      {/* Social buttons — icon + label, one row like register */}
      <div className="flex gap-2 mb-4">
        {SOCIAL.map(({ Icon, label, provider }) => (
          <button
            key={provider}
            onClick={() => setSocialProvider(provider)}
            disabled={social.loading || login.loading}
            className="flex-1 flex items-center justify-center gap-[7px] px-3 py-[10px] bg-white border border-bone rounded-xl text-[12px] font-medium text-charcoal hover:bg-[#F8F8F8] cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-[12px] text-slate">
        Don't have an account?{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
          Register
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
