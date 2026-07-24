import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { RoleSegmentedControl } from '@/components/comman/ui/RoleSegmentedControl';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import type { AppRole } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MarketplaceMockup } from '@/features/auth/components/mockups/AuthMockups';

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer'  },
  { value: 'seller', label: 'Seller' },
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

  return (
    <AuthSplitLayout
      heading="Commerce. Solved."
      subtext="Join thousands of buyers and sellers building their business on Solvexo's marketplace."
      highlights={HIGHLIGHTS}
      visual={<MarketplaceMockup />}
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
      <RoleSegmentedControl
        label="Sign in as"
        options={ROLE_OPTIONS}
        value={role}
        onChange={val => handleRoleToggle(val as AppRole)}
        className="mb-4"
      />

      <div className="flex flex-col gap-3">
        <Input
          id="login-email"
          label="Email Address"
          type="email" placeholder="Enter Your Email Address" autoComplete="email"
          value={values.email} onChange={set('email')} onBlur={blur('email')}
          error={errors.email}
        />
        <div>
          <Input
            id="login-password"
            label="Password"
            type={showPass ? 'text' : 'password'} placeholder="Enter Your Password" autoComplete="current-password"
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

      {/* Social buttons */}
      <SocialLoginRow
        onSelect={social.notConfigured}
        disabled={social.loading || login.loading}
        className="mb-4"
      />

      <p className="text-center text-[12px] text-slate">
        Don't have an account?{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
          Register
        </Button>
      </p>
    </AuthSplitLayout>
  );
}
