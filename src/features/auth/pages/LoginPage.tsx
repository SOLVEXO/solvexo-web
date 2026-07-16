import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { Eye, EyeOff, Globe, Smartphone, Share2, ShieldCheck, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import type { AppRole } from '@/api/services/auth';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';

function RoleSwitch({ role, onToggle }: { role: AppRole; onToggle: (r: AppRole) => void }) {
  return (
    <div className="flex rounded-xl bg-cream p-1 gap-1 border border-bone">
      {(['user', 'seller'] as AppRole[]).map((r) => {
        const active = role === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onToggle(r)}
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
  );
}

const SOCIAL = [
  { Icon: Globe,       label: 'Google',   color: '#4285F4' },
  { Icon: Smartphone,  label: 'Apple',    color: '#141413' },
  { Icon: Share2,      label: 'Facebook', color: '#1877F2' },
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
  const [role, setRole]         = useState<AppRole>('user');
  const [showPass, setShowPass] = useState(false);

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
      heading={<>Commerce.<br />Solved.</>}
      subtext="Join thousands of buyers and sellers building their business on Solvexo's marketplace."
      highlights={HIGHLIGHTS}
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

      {/* Role switch */}
      <div className="mb-3">
        <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Sign in as</label>
        <RoleSwitch role={role} onToggle={setRole} />
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

      {login.error && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{login.error}</span>
        </div>
      )}

      {/* OR divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-bone" />
        <span className="text-[11px] text-slate">or continue with</span>
        <div className="flex-1 h-px bg-bone" />
      </div>

      {/* Social */}
      <div className="flex gap-[10px] mb-4">
        {SOCIAL.map(({ Icon, label, color }) => (
          <Button key={label} variant="outline" size="md" aria-label={`Continue with ${label}`} className="flex-1 basis-0 px-2">
            <Icon size={16} style={{ color }} />
          </Button>
        ))}
      </div>

      <p className="text-center text-[12px] text-slate">
        Don't have an account?{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
          Register
        </Button>
      </p>
    </AuthSplitLayout>
  );
}
