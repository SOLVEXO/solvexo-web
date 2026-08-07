import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button }      from '@/components/comman/ui/Button';
import { Input }       from '@/components/comman/ui/Input';
import { SolvexoLogo } from '@/components/comman/ui/SolvexoLogo';
import { RoleChoiceCards } from '@/components/comman/ui/RoleChoiceCards';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShoppingBag, Store, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import { TokenStorage, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MarketplaceMockup, DashboardMockup } from '@/features/auth/components/mockups/AuthMockups';

const ROLE_OPTIONS = [
  { value: 'user',   label: 'Buyer',  description: 'Browse and purchase from the marketplace', Icon: ShoppingBag },
  { value: 'seller', label: 'Seller', description: 'Create a store and sell to thousands of buyers', Icon: Store },
];

const HIGHLIGHTS = [
  { Icon: ShoppingBag, text: 'Shop from thousands of independent sellers' },
  { Icon: Store,       text: 'Launch your own store in minutes' },
  { Icon: TrendingUp,  text: 'Grow your business with built-in analytics' },
];

// Register is two screens, not one crowded form: the role choice is the
// first meaningful decision a new user makes (mirrors how Login's role
// switch works, and reuses the exact same RoleChoiceCards component so the
// two pages read as one design language), and only once that's picked does
// the account-detail form — identical for both roles, just relabelled —
// appear. Nothing about the backend payload/validation changes here.
export function RegisterPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  usePageTitle('Register');
  const register  = useRegister();
  const social    = useSocialLogin();
  const [showPass, setShowPass] = useState(false);

  // A "Sell on Solvexo" CTA arrives here as /register?role=seller — that
  // click already WAS the role decision, so the role screen is skipped
  // entirely instead of asking the same question twice.
  const presetRole = searchParams.get('role') === 'seller' ? 'seller' : searchParams.get('role') === 'user' ? 'user' : '';
  const [screen, setScreen] = useState<'role' | 'details'>(presetRole ? 'details' : 'role');

  const { values, errors, set, setValue, blur, handleSubmit } = useForm(
    registerSchema,
    { name: '', email: '', password: '', phone: '', address: '', role: presetRole },
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

  // Already signed in — send them to wherever they actually belong instead
  // of showing a registration form to someone who doesn't need one.
  useEffect(() => {
    if (!TokenStorage.isLoggedIn()) return;
    const user = TokenStorage.getUser<{ role?: AppRole }>();
    if (user?.role === 'seller') {
      resolveSellerDestinationRemote().then(dest => navigate(dest, { replace: true }));
    } else {
      navigate(getRoleRedirect((user?.role ?? 'user') as AppRole), { replace: true });
    }
  }, [navigate]);

  // Avoid a flash of the registration form for the (rare) already-signed-in
  // visitor while the effect above resolves their real destination.
  if (TokenStorage.isLoggedIn()) return null;

  const isSeller = values.role === 'seller';
  const roleChosen = values.role === 'user' || values.role === 'seller';
  const activeRoleLabel = ROLE_OPTIONS.find(o => o.value === values.role)?.label;

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      heading={isSeller ? 'Launch your store today' : 'Start selling or shopping today'}
      subtext="Create your free Solvexo account and join a growing community of buyers and creators."
      highlights={HIGHLIGHTS}
      maxWidth="max-w-[520px]"
      visual={isSeller ? <DashboardMockup /> : <MarketplaceMockup />}
    >
      <div className="lg:hidden flex justify-center mb-5">
        <SolvexoLogo size={32} />
      </div>

      {screen === 'role' ? (
        <>
          <h1 className="text-[22px] font-bold text-carbon mb-1 text-center lg:text-left">
            How do you want to use Solvexo?
          </h1>
          <p className="text-[13px] text-slate mb-5 text-center lg:text-left">
            Choose what fits you best — you can always add the other side of the marketplace later.
          </p>

          <RoleChoiceCards
            options={ROLE_OPTIONS}
            value={values.role}
            onChange={val => setValue('role', val)}
            className="mb-5"
          />

          <Button
            variant="primary" size="md" fullWidth
            onClick={() => roleChosen && setScreen('details')}
            disabled={!roleChosen}
            iconRight={<ArrowRight size={14} />}
          >
            Continue
          </Button>

          <p className="text-center text-[12px] text-slate mt-4">
            Already have an account?{' '}
            <Button variant="link" size="sm" onClick={() => navigate('/login')} className="font-semibold!">
              Sign In
            </Button>
          </p>
        </>
      ) : (
        <>
          <button
            onClick={() => setScreen('role')}
            className="inline-flex items-center gap-[6px] text-[12px] font-medium text-slate bg-transparent border-none cursor-pointer mb-4 hover:text-charcoal transition-colors"
          >
            <ArrowLeft size={12} /> Signing up as <strong className="text-charcoal">{activeRoleLabel}</strong> — change
          </button>

          <h1 className="text-[22px] font-bold text-carbon mb-1 text-center lg:text-left">
            {isSeller ? 'Create your seller account' : 'Create your buyer account'}
          </h1>
          <p className="text-[13px] text-slate mb-5 text-center lg:text-left">
            Join Solvexo — Commerce. Solved.
          </p>

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
            {isSeller ? 'Create Seller Account' : 'Create Buyer Account'}
          </Button>

          {register.error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{register.error}</span>
            </div>
          )}
          {/* Not a failure — a known, honestly-labeled unavailable feature —
             so it gets the neutral "info" treatment instead of the red error one. */}
          {!register.error && social.error && (
            <div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mt-3 text-[13px] text-info">
              <Info size={14} className="shrink-0" />
              <span>{social.error}</span>
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
            onSelect={social.notConfigured}
            disabled={social.loading || register.loading}
            className="mb-4"
          />

          <p className="text-center text-[12px] text-slate mt-2">
            Already have an account?{' '}
            <Button variant="link" size="sm" onClick={() => navigate('/login')} className="font-semibold!">
              Sign In
            </Button>
          </p>
        </>
      )}
    </AuthSplitLayout>
  );
}
