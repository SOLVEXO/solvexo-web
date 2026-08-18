import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeRedirectPath } from '@/utils/safeRedirect';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLogin } from '@/hooks/auth/useLogin';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { Avatar } from '@/components/comman/ui/Avatar';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ShieldCheck, Sparkles, Zap, AlertTriangle, Info, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useForm } from '@/hooks/useForm';
import { loginSchema, type LoginFormData } from '@/utils/validation/schemas';
import { TokenStorage, LastRolePreference, RememberedAccount, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MarketplaceMockup } from '@/features/auth/components/mockups/AuthMockups';

const HIGHLIGHTS = [
  { Icon: Sparkles,    text: 'Curated marketplace of independent creators' },
  { Icon: Zap,         text: 'Fast checkout, real-time order tracking' },
  { Icon: ShieldCheck, text: 'Secure payments on every purchase' },
];

// Three possible openings, exactly mirroring Google's real account-chooser
// flow (see RememberedAccount, api/services/auth.ts — a device-local UX
// shortcut, never an identity check). The current phase lives in the URL
// itself (`?step=password`, matching Google's own .../identifier vs .../pwd
// URL split) rather than only in component state — every explicit step
// change (picking an account, going back, adding a new account) is a real
// navigation with its own history entry, so the browser back button and a
// bookmarked/shared link both land on the right phase instead of always
// resetting to step one:
//  1. No `step` param, a RememberedAccount exists → an account-picker
//     screen: the account as one clickable row (avatar + name + email) plus
//     a real "Add new account" button below it — nothing else.
//  2. `?step=password` (that row was clicked) → the account becomes a small
//     locked summary at the top, with just the password field + Sign In
//     button below it.
//  3. `?new=1` (no remembered account, or "Add new account" was clicked) →
//     the fresh flow: stacked social pills, then a single email field, with
//     `?step=password` following automatically once an email has actually
//     been typed (Google-style progressive disclosure) rather than showing
//     both at once — that particular transition uses `replace` so typing
//     doesn't spam browser history.
// Which account (buyer vs seller) to sign into is picked via a small inline
// toggle rather than a separate role-choice step, since it only matters for
// disambiguating which backend collection to query (a buyer and seller
// account can share the same email).
export function LoginPage() {
  const navigate   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('redirect'));
  usePageTitle('Login');
  const login      = useLogin();
  const social     = useSocialLogin();
  // Defaults to whichever role this device last registered/logged in as —
  // previously always hardcoded to "Buyer", so a seller who forgot to flip
  // the toggle got a misleading "Invalid email or password" (their account
  // lives in a different collection than the one being queried). A `?role=`
  // param (e.g. the "Continue as X" button on RegisterPage's account
  // chooser) wins over both when present.
  const queryRole = searchParams.get('role') === 'seller' ? 'seller' : searchParams.get('role') === 'user' ? 'user' : null;
  const remembered = RememberedAccount.get();
  const [role, setRole]           = useState<AppRole>(() => queryRole ?? remembered?.role ?? LastRolePreference.get());
  const [showPass, setShowPass]   = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const explicitNewAccount = searchParams.get('new') === '1';
  const showChooser = !!remembered && !explicitNewAccount;
  const onPasswordStep = searchParams.get('step') === 'password';

  const { values, errors, set, setValue, blur, handleSubmit } = useForm(
    loginSchema,
    { email: remembered?.email ?? '', password: '' },
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

  const freshEmailEntered = values.email.trim().length > 0;
  // What actually gates rendering the password step: in the chooser flow
  // that's purely the URL (a click already fired before this renders, so
  // there's no lag); in the fresh-typing flow it's the raw typed value
  // directly, so the field appears on the very same keystroke instead of
  // waiting a render cycle for the URL-sync effect below to catch up.
  const showPasswordStep = showChooser ? onPasswordStep : freshEmailEntered;

  // Fresh flow only: the URL follows the reactive email-typed reveal (for
  // back-button/shareable-link purposes), as a `replace` (not a new history
  // entry) since it fires on every keystroke transition rather than a
  // deliberate click — an explicit navigation (picking an account, going
  // back, adding a new account) still gets its own real entry via the
  // handlers below.
  useEffect(() => {
    if (showChooser) return;
    if (freshEmailEntered === onPasswordStep) return;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (freshEmailEntered) next.set('step', 'password'); else next.delete('step');
      return next;
    }, { replace: true });
  }, [showChooser, freshEmailEntered, onPasswordStep, setSearchParams]);

  if (TokenStorage.isLoggedIn()) return null;

  const otherRole: AppRole = role === 'user' ? 'seller' : 'user';
  const roleLabel = (r: AppRole) => (r === 'seller' ? 'seller' : 'buyer');
  const switchRole = useCallback(() => setRole(otherRole), [otherRole]);

  const selectAccount = useCallback(() => {
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('step', 'password'); return next; });
  }, [setSearchParams]);

  const backToPicker = useCallback(() => {
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('step'); return next; });
  }, [setSearchParams]);

  const useDifferentAccountHandler = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('new', '1');
      next.delete('step');
      return next;
    });
    setValue('email', '');
  }, [setSearchParams, setValue]);

  return (
    <AuthSplitLayout
      heading={<>Commerce. <span className="text-brand-orange">Solved</span></>}
      subtext="Join thousands of buyers and sellers building their business on Solvexo's marketplace."
      highlights={HIGHLIGHTS}
      visual={<MarketplaceMockup />}
    >
      <h1 className="text-[20px] font-bold text-carbon mb-1 text-center lg:text-left">
        <span className="text-brand-orange">Sign in</span> to Solvexo
      </h1>
      <p className="text-[12.5px] text-slate mb-1 text-center lg:text-left">
        {showChooser && !onPasswordStep ? 'Choose an account to continue' : 'Enter your details to continue'}
      </p>

      {showChooser ? (
        onPasswordStep ? (
          <>
            {/* Locked-in summary once the account row has been picked — same
               identity, no longer clickable, with a way back to the picker. */}
            <button
              type="button"
              onClick={backToPicker}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-bone bg-cream mb-3 text-left cursor-pointer hover:border-slate/40 transition-colors"
            >
              <ArrowLeft size={14} className="text-slate shrink-0" />
              <Avatar name={remembered!.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-carbon truncate">{remembered!.name}</p>
                <p className="text-[12px] text-slate truncate">{remembered!.email}</p>
              </div>
            </button>
          </>
        ) : (
          <>
            {/* Step 1 — picker only: the account as one clickable row, plus a
               real "Add new account" button. Nothing else on this screen. */}
            <button
              type="button"
              onClick={selectAccount}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-bone bg-white cursor-pointer text-left hover:border-brand-orange hover:bg-brand-pale-orange/20 transition-colors mb-3"
            >
              <Avatar name={remembered!.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-carbon truncate">{remembered!.name}</p>
                <p className="text-[12px] text-slate truncate">{remembered!.email}</p>
              </div>
              <ChevronRight size={16} className="text-slate shrink-0" />
            </button>

            <Button
              variant="outline" size="md" fullWidth
              onClick={useDifferentAccountHandler}
              icon={<UserPlus size={14} />}
              className="mb-3 lg:mb-4"
            >
              Add new account
            </Button>
          </>
        )
      ) : (
        <>
          <p className="text-center lg:text-left mb-2.5 lg:mb-4">
            <span className="text-[11.5px] text-slate">
              Signing in as a <strong className="text-charcoal">{roleLabel(role)}</strong> —{' '}
            </span>
            <Button variant="link" size="sm" onClick={switchRole} className="font-semibold! text-[11.5px]!">
              switch to {roleLabel(otherRole)}
            </Button>
          </p>

          {/* Before an email is typed: full stacked social pills, one per
             row. Once the password field appears, the socials collapse into
             a single compact row and move below the form instead. */}
          {!freshEmailEntered && (
            <>
              <SocialLoginRow
                layout="stacked"
                onSelect={social.notConfigured}
                disabled={social.loading}
                className="mb-3 lg:mb-4"
              />

              {/* Not a failure — a known, honestly-labeled unavailable
                 feature — so it gets the neutral "info" treatment instead of
                 the red error one. */}
              {social.error && (
                <div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mb-3 text-[13px] text-info">
                  <Info size={14} className="shrink-0" />
                  <span>{social.error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-3 lg:mb-4">
                <div className="flex-1 h-px bg-bone" />
                <span className="text-[11px] text-slate">or continue with email</span>
                <div className="flex-1 h-px bg-bone" />
              </div>
            </>
          )}

          <Input
            id="login-email"
            label="Email Address"
            type="email" placeholder="Enter Your Email Address" autoComplete="email"
            value={values.email} onChange={set('email')} onBlur={blur('email')}
            onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
            error={errors.email}
            autoFocus
          />
        </>
      )}

      {/* Password — shown once an identity is locked in, whichever path got
         us there. */}
      {showPasswordStep && (
        <div className="mt-3">
          <Input
            ref={passwordRef}
            id="login-password"
            label="Password"
            type={showPass ? 'text' : 'password'} placeholder="Enter Your Password" autoComplete="current-password"
            value={values.password} onChange={set('password')} onBlur={blur('password')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            error={errors.password}
            // Only steal focus here when we arrived via the account picker
            // (nothing else was focused) — in the fresh-email flow this
            // field mounts the instant the FIRST character is typed into
            // email, so auto-focusing it there would yank focus away
            // mid-keystroke. The email field's own Enter-key handler covers
            // that jump instead.
            autoFocus={showChooser}
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

          <Button variant="primary" size="md" fullWidth onClick={handleSubmit} loading={login.loading} className="mt-3 lg:mt-4">
            Sign In
          </Button>

          {login.error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{login.error}</span>
            </div>
          )}
          {!login.error && social.error && (
            <div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mt-3 text-[13px] text-info">
              <Info size={14} className="shrink-0" />
              <span>{social.error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 my-2.5 lg:my-4">
            <div className="flex-1 h-px bg-bone" />
            <span className="text-[11px] text-slate">or continue with</span>
            <div className="flex-1 h-px bg-bone" />
          </div>

          <SocialLoginRow
            onSelect={social.notConfigured}
            disabled={social.loading || login.loading}
            className="mb-3 lg:mb-4"
          />
        </div>
      )}

      {/* Covers the "account doesn't exist" case without a real
         pre-check — a failed sign-in still lands right next to this. */}
      <p className="text-center text-[12px] text-slate mt-3">
        New to Solvexo?{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/register')} className="font-semibold!">
          Create an account
        </Button>
      </p>
    </AuthSplitLayout>
  );
}
