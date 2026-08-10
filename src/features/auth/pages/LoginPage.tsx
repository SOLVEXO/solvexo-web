import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { RoleChoiceCards } from '@/components/comman/ui/RoleChoiceCards';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap, AlertTriangle, Info, ShoppingBag, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { TokenStorage, LastRolePreference, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MarketplaceMockup } from '@/features/auth/components/mockups/AuthMockups';

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer',  description: 'Browse and purchase from the marketplace', Icon: ShoppingBag, accent: 'orange' as const },
  { value: 'seller', label: 'Seller', description: 'Manage your store, orders and listings', Icon: Store, accent: 'success' as const },
];

const HIGHLIGHTS = [
  { Icon: Sparkles,    text: 'Curated marketplace of independent creators' },
  { Icon: Zap,         text: 'Fast checkout, real-time order tracking' },
  { Icon: ShieldCheck, text: 'Secure payments on every purchase' },
];

export function LoginPage() {
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect'));
  usePageTitle('Login');
  const login      = useLogin();
  const social     = useSocialLogin();
  // Defaults to whichever role this device last registered/logged in as —
  // previously always hardcoded to "Buyer", so a seller who forgot to flip
  // the toggle got a misleading "Invalid email or password" (their account
  // lives in a different collection than the one being queried).
  const [role, setRole]           = useState<AppRole>(() => LastRolePreference.get());
  const [showPass, setShowPass]   = useState(false);
  // Three steps, mirroring Register's role-first pattern: pick an account
  // type (big cards, same as Register), then the unified "sign in or create
  // account" entry (stacked social pills + a "Continue with email" pill —
  // no bare email field here, that lives on the next step), then the
  // email/password step — which pushes social login back into a compact
  // row below it.
  const [step, setStep]           = useState<'role' | 'entry' | 'signin'>('role');

  // Stable role toggle — doesn't reset form or trigger re-mount of hook states
  const handleRoleToggle = useCallback((r: AppRole) => setRole(r), []);

  const { values, errors, set, blur, handleSubmit } = useForm(
    loginSchema,
    { email: '', password: '' },
    {
      onSubmit: async (data: LoginFormData) => {
        await login.execute({ email: data.email, password: data.password, role }, redirectTo);
      },
    },
  );

  // Already signed in — send them to wherever they actually belong instead
  // of showing a login form to someone who doesn't need one.
  useEffect(() => {
    if (!TokenStorage.isLoggedIn()) return;
    const user = TokenStorage.getUser<{ role?: AppRole }>();
    if (user?.role === 'seller') {
      resolveSellerDestinationRemote().then(dest => navigate(dest, { replace: true }));
    } else {
      navigate(redirectTo || getRoleRedirect((user?.role ?? 'user') as AppRole), { replace: true });
    }
  }, [navigate, redirectTo]);

  if (TokenStorage.isLoggedIn()) return null;

  const activeRoleLabel = ROLE_OPTIONS.find(o => o.value === role)?.label;

  return (
    <AuthSplitLayout
      heading={<>Commerce. <span className="text-brand-orange">Solved</span></>}
      subtext="Join thousands of buyers and sellers building their business on Solvexo's marketplace."
      highlights={HIGHLIGHTS}
      visual={<MarketplaceMockup />}
    >
      {step === 'entry' && (
        <button
          onClick={() => setStep('role')}
          className="inline-flex items-center gap-[6px] text-[12px] font-medium text-slate bg-transparent border-none cursor-pointer mb-4 hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={12} /> Signing in as <strong className="text-charcoal">{activeRoleLabel}</strong> — change
        </button>
      )}
      {step === 'signin' && (
        <button
          onClick={() => setStep('entry')}
          className="inline-flex items-center gap-[6px] text-[12px] font-medium text-slate bg-transparent border-none cursor-pointer mb-4 hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={12} /> Use a different sign-in method
        </button>
      )}

      <h1 className="text-[20px] font-bold text-carbon mb-1 text-center lg:text-left">
        {step === 'role' ? (
          <>Which account are you <span className="text-brand-orange">signing in</span> to?</>
        ) : step === 'entry' ? (
          <><span className="text-brand-orange">Sign in</span> or create account</>
        ) : 'Sign in'}
      </h1>
      <p className="text-[12.5px] text-slate mb-2.5 lg:mb-4 text-center lg:text-left">
        {step === 'role'
          ? 'Choose the account type — you can switch anytime later.'
          : step === 'entry'
          ? 'Sign in to your Solvexo account, or create a new one'
          : 'Enter your password to continue'}
      </p>

      {step === 'role' ? (
        <>
          <RoleChoiceCards
            options={ROLE_OPTIONS}
            value={role}
            onChange={val => handleRoleToggle(val as AppRole)}
            className="mb-3 lg:mb-5"
          />

          <Button
            variant="primary" size="md" fullWidth
            onClick={() => setStep('entry')}
            iconRight={<ArrowRight size={14} />}
          >
            Continue
          </Button>

          <p className="text-center text-[12px] text-slate mt-3 lg:mt-4">
            Don't have an account?{' '}
            <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
              Register
            </Button>
          </p>
        </>
      ) : step === 'entry' ? (
        <>
          {/* Stacked pills, Alibaba-style: 3 social + "Continue with email"
             as a 4th outlined pill — no bare email field on this screen. */}
          <SocialLoginRow
            layout="stacked"
            onSelect={social.notConfigured}
            onEmailSelect={() => setStep('signin')}
            disabled={social.loading}
          />

          {social.error && (
            <div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mt-3 text-[13px] text-info">
              <Info size={14} className="shrink-0" />
              <span>{social.error}</span>
            </div>
          )}

          <p className="text-center text-[12px] text-slate mt-3 lg:mt-4">
            Don't have an account?{' '}
            <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
              Register
            </Button>
          </p>
        </>
      ) : (
        <>
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
                autoFocus
              />
              <div className="flex justify-end mt-2">
                <Button variant="link" size="sm" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </Button>
              </div>
            </div>
          </div>

          <Button variant="primary" size="md" fullWidth onClick={handleSubmit} loading={login.loading} className="mt-3 lg:mt-4">
            Sign In
          </Button>

          {login.error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{login.error}</span>
            </div>
          )}
          {/* Not a failure — a known, honestly-labeled unavailable feature — so
             it gets the neutral "info" treatment instead of the red error one. */}
          {!login.error && social.error && (
            <div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mt-3 text-[13px] text-info">
              <Info size={14} className="shrink-0" />
              <span>{social.error}</span>
            </div>
          )}

          {/* OR divider */}
          <div className="flex items-center gap-3 my-2.5 lg:my-4">
            <div className="flex-1 h-px bg-bone" />
            <span className="text-[11px] text-slate">or continue with</span>
            <div className="flex-1 h-px bg-bone" />
          </div>

          {/* Social buttons — pushed below the password form */}
          <SocialLoginRow
            onSelect={social.notConfigured}
            disabled={social.loading || login.loading}
            className="mb-3 lg:mb-4"
          />

          {/* Covers the "account doesn't exist" case without a real
             pre-check — a failed sign-in still lands right next to this. */}
          <p className="text-center text-[12px] text-slate">
            New to Solvexo?{' '}
            <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
              Create an account
            </Button>
          </p>
        </>
      )}
    </AuthSplitLayout>
  );
}
