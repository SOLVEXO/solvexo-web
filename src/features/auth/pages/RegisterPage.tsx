import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRegister } from '@/hooks/auth/useRegister';
import { useSocialLogin } from '@/hooks/auth/useSocialLogin';
import { Button }      from '@/components/comman/ui/Button';
import { Input }       from '@/components/comman/ui/Input';
import { PhoneInput }  from '@/components/comman/ui/PhoneInput';
import { Avatar }      from '@/components/comman/ui/Avatar';
import { useDetectedCountry } from '@/hooks/auth/useDetectedCountry';
import { SocialLoginRow } from '@/components/comman/ui/SocialIcons';
import { Eye, EyeOff, ArrowRight, Store, Sparkles, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { useForm }     from '@/hooks/useForm';
import { registerSchema, type RegisterFormData } from '@/utils/validation/schemas';
import { TokenStorage, getRoleRedirect, RememberedAccount, type AppRole } from '@/api/services/auth';
import { resolveSellerDestinationRemote } from '@/utils/sellerRouting';
import { getSellerAcquisitionFields } from '@/utils/sellerAcquisitionAttribution';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { motion } from 'motion/react';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { REGISTER_TEXT } from './RegisterPage.text';
import { AUTH_SHARED_TEXT, formError } from './authPages.text';

const fadeSlide = { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } };

// Same spinner LoginPage.tsx uses in the identical situation — see the
// blank-page fix on the `TokenStorage.isLoggedIn()` check below.
function RedirectingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[55vh]">
      <div className="w-5 h-5 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
    </div>
  );
}

// Same 3 lines Login and the onboarding wizard use (OnboardingPage.tsx) —
// one consistent voice across the seller funnel. "Shop from thousands of
// independent sellers" was real BUYER-marketplace language, stale here
// since Register is seller-only now (see SELLER_ONLY_REGISTER below).
const HIGHLIGHTS = [
  { Icon: Store,       text: 'A store built around how you sell' },
  { Icon: Sparkles,    text: 'Analytics from day one' },
  { Icon: ShieldCheck, text: 'Verified sellers buyers can trust' },
];
// The text lives in AUTH_SHARED_TEXT.sellerHighlights (one per icon, same order).
const HIGHLIGHT_ICONS = [Store, Sparkles, ShieldCheck];

// One screen, not three — the account type is decided by HOW someone got
// here, never asked twice: a "Sell on Solvexo" CTA arrives as
// /register?role=seller (that click already WAS the role decision), any
// other visit is a plain buyer sign-up. Socials + the full detail form live
// together on the same screen, Amazon/Shopify-style, instead of a
// role-picker step followed by a "choose how to continue" step.
//
// Same progressive-disclosure pattern as LoginPage: only the email field
// shows up front, with stacked social pills above it; the rest of the
// details (name/phone/address/password) only reveal once an email has
// actually been typed, at which point the socials collapse into a single
// compact row below the form instead.
//
// Shopify/Google-style account recognition: if this device has a
// `RememberedAccount` (see api/services/auth.ts — survives logout, it's a
// pure UX shortcut, never an identity check) matching the role this page is
// for, an account-picker row replaces the whole form up front instead —
// "Add new account" falls through to the normal sign-up flow above.
//
// Like LoginPage, the current phase lives in the URL (`?step=details`,
// `?new=1`) rather than only in component state, so it's a real navigation
// (back button, bookmarks/shared links) instead of state that resets the
// instant the page reloads.
// Business rule (frontend-only, deliberately reversible — mirrors
// LoginPage's SELLER_ONLY_LOGIN): registration on the web is seller-only
// right now. A plain /register visit used to default to a buyer sign-up
// (only `?role=seller`, e.g. from a "Sell on Solvexo" CTA, went straight to
// seller); that buyer path is hidden, not deleted — the backend register
// endpoint still accepts role:'user' unchanged, so flipping this back to
// false fully restores it with no other changes.
const SELLER_ONLY_REGISTER = true;

export function RegisterPage() {
  const navigate  = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pageLang } = useSiteLang();
  const t = useSiteText(REGISTER_TEXT);
  const s = useSiteText(AUTH_SHARED_TEXT);
  const HIGHLIGHTS = s.sellerHighlights.map((text, i) => ({ Icon: HIGHLIGHT_ICONS[i], text }));
  // Email/password/phone stay left-to-right inside the Arabic page; the placeholder sits on the right until typing starts.
  const ltrPlaceholder = pageLang === 'ar' ? 'placeholder-shown:text-right' : undefined;
  usePageTitle(t.pageTitle);
  const register  = useRegister();
  const [showPass, setShowPass] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const role: AppRole = SELLER_ONLY_REGISTER ? 'seller' : (searchParams.get('role') === 'seller' ? 'seller' : 'user');
  const social    = useSocialLogin(role);
  const isSeller = role === 'seller';
  const remembered = RememberedAccount.get();
  const explicitNewAccount = searchParams.get('new') === '1';
  const showChooser = !!remembered && remembered.role === role && !explicitNewAccount;
  const onDetailsStep = searchParams.get('step') === 'details';

  const detectedCountry = useDetectedCountry();
  const { values, errors, set, setValue, blur, handleSubmit } = useForm(
    registerSchema,
    { name: '', email: (searchParams.get('email') ?? '').slice(0, 254), password: '', phone: '', address: '', role },
    {
      onSubmit: async (data: RegisterFormData) => {
        const isSellerSignup = data.role === 'seller';
        await register.execute({
          name:     data.name,
          email:    data.email,
          password: data.password,
          phone:    data.phone,
          address:  data.address,
          role:     (isSellerSignup ? 'seller' : 'user'),
          // Phase 9 — only meaningful for a seller signup (buyer accounts
          // have no acquisitionSource field on their schema at all). Reads
          // back whatever UTM/referrer snapshot main.tsx captured on this
          // visitor's first page load; {} when nothing was ever captured
          // (organic/direct), which the backend correctly stores as null.
          ...(isSellerSignup ? getSellerAcquisitionFields() : {}),
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

  const emailEntered = values.email.trim().length > 0;

  // The URL follows the reactive email-typed reveal as a `replace` (not a
  // new history entry, since it fires on every keystroke transition) —
  // "Add new account" below still gets its own real navigation entry.
  useEffect(() => {
    if (showChooser) return;
    if (emailEntered === onDetailsStep) return;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (emailEntered) next.set('step', 'details'); else next.delete('step');
      return next;
    }, { replace: true });
  }, [showChooser, emailEntered, onDetailsStep, setSearchParams]);

  const addNewAccount = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('new', '1');
      next.delete('step');
      return next;
    });
  }, [setSearchParams]);

  // Was `return null` — same blank-screen cause fixed in LoginPage.tsx: this
  // is a real network call (resolveSellerDestinationRemote()) away from
  // actually navigating, and any re-render of this page in that gap hits
  // this check and blanks the whole page instead of showing anything. A
  // spinner instead of null in the same slot is never blank while it waits.
  if (TokenStorage.isLoggedIn()) return <RedirectingSpinner />;

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      pageContext="register"
      heading={isSeller
        ? <>{t.sellerHeroBefore}<span className="text-brand-orange">{t.sellerHeroAccent}</span>{t.sellerHeroAfter}</>
        : <>{t.buyerHeroBefore}<span className="text-brand-orange">{t.buyerHeroAccent}</span>{t.buyerHeroAfter}</>}
      subtext={t.subtext}
      highlights={HIGHLIGHTS}
      maxWidth="max-w-[520px]"
    >
      <h1 className="text-[22px] font-bold text-carbon mb-1 text-center lg:text-start">
        {showChooser
          ? <>{t.welcomeBefore}<span className="text-brand-orange">{t.welcomeAccent}</span>{t.welcomeAfter}</>
          : isSeller
            ? <>{t.createSellerBefore}<span className="text-brand-orange">{t.createSellerAccent}</span>{t.createSellerAfter}</>
            : <>{t.createBefore}<span className="text-brand-orange">{t.createAccent}</span>{t.createAfter}</>}
      </h1>
      <p className="text-[13px] text-slate mb-3 lg:mb-5 text-center lg:text-start">
        {showChooser ? t.usedBefore : t.signUpWith}
      </p>

      {showChooser && remembered ? (
        <>
          {/* The whole row is the "continue" action, Google-account-picker
             style — clicking it goes straight to LoginPage's password step
             for this account, not a separate confirm click. */}
          <button
            type="button"
            onClick={() => navigate(isSeller ? '/login?role=seller' : '/login')}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-bone bg-white cursor-pointer text-start hover:border-brand-orange hover:bg-brand-pale-orange/20 transition-colors mb-3"
          >
            <Avatar name={remembered.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-carbon truncate">{remembered.name}</p>
              <p className="text-[12px] text-slate truncate">{remembered.email}</p>
            </div>
            <ArrowRight size={16} className="text-slate shrink-0 rtl:-scale-x-100" />
          </button>

          <Button
            variant="outline" size="md" fullWidth
            onClick={addNewAccount}
            className="mb-3 lg:mb-4"
          >
            {s.addNewAccount}
          </Button>
        </>
      ) : (
      <>
      {!emailEntered && (
        <>
          <SocialLoginRow
            layout="stacked"
            mount={social.mount}
            disabled={social.loading}
            className="mb-3 lg:mb-4"
          />

          {social.error && (
            <motion.div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mb-3 text-[13px] text-info" {...fadeSlide}>
              <Info size={14} className="shrink-0" />
              <span>{formError(social.error, pageLang)}</span>
            </motion.div>
          )}

          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <div className="flex-1 h-px bg-bone" />
            <span className="text-[11px] text-slate">{s.orContinueWithEmail}</span>
            <div className="flex-1 h-px bg-bone" />
          </div>
        </>
      )}

      <Input
        label={s.emailLabel} type="email" placeholder={s.emailPlaceholder} autoComplete="email"
        dir="ltr" className={ltrPlaceholder}
        value={values.email} onChange={set('email')} onBlur={blur('email')}
        onKeyDown={e => e.key === 'Enter' && nameRef.current?.focus()}
        error={formError(errors.email, pageLang)}
        autoFocus
      />

      {/* The rest of the details only show up once an email has actually
         been typed — same reveal LoginPage uses for its password field. */}
      {emailEntered && (
        <motion.div {...fadeSlide}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3 mt-3">
            <Input
              ref={nameRef}
              label={t.nameLabel} placeholder={t.namePlaceholder} autoComplete="name"
              value={values.name} onChange={set('name')} onBlur={blur('name')}
              error={formError(errors.name, pageLang)}
            />
            {/* Flag/dial code + number stay left-to-right in Arabic too (the label still follows the page). */}
            <div className={pageLang === 'ar' ? '[&_.PhoneInput]:[direction:ltr] [&_input]:placeholder-shown:text-right' : undefined}>
              <PhoneInput
                label={t.phoneLabel} placeholder={t.phonePlaceholder}
                value={values.phone} onChange={v => setValue('phone', v)} onBlur={blur('phone')}
                error={formError(errors.phone, pageLang)} defaultCountry={detectedCountry}
              />
            </div>
            <Input
              label={t.addressLabel} placeholder={t.addressPlaceholder} autoComplete="street-address"
              value={values.address} onChange={set('address')} onBlur={blur('address')}
              error={formError(errors.address, pageLang)}
            />
            <Input
              label={s.passwordLabel} type={showPass ? 'text' : 'password'} placeholder={t.passwordPlaceholder} autoComplete="new-password"
              dir="ltr" className={ltrPlaceholder}
              value={values.password} onChange={set('password')} onBlur={blur('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              error={formError(errors.password, pageLang)}
              rightIcon={
                <button type="button" onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? s.hidePassword : s.showPassword}
                  className="bg-transparent border-none cursor-pointer text-slate p-0 flex hover:text-charcoal transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <MagneticButton className="block mt-3 lg:mt-4">
            <Button
              variant="primary" size="md" fullWidth
              onClick={handleSubmit}
              loading={register.loading}
              iconRight={!register.loading && <ArrowRight size={14} className="rtl:-scale-x-100" />}
            >
              {isSeller ? t.createSeller : t.createBuyer}
            </Button>
          </MagneticButton>
        </motion.div>
      )}

      {register.error && (
        <motion.div role="alert" className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mt-3 text-[13px] text-error" {...fadeSlide}>
          <AlertTriangle size={14} className="shrink-0" />
          <span>{register.error}</span>
        </motion.div>
      )}
      {!register.error && social.error && emailEntered && (
        <motion.div role="status" className="flex items-center gap-2 rounded-lg bg-info-bg px-[14px] py-[10px] mt-3 text-[13px] text-info" {...fadeSlide}>
          <Info size={14} className="shrink-0" />
          <span>{formError(social.error, pageLang)}</span>
        </motion.div>
      )}

      {emailEntered && (
        <motion.div {...fadeSlide}>
          <div className="flex items-center gap-3 my-2.5 lg:my-4">
            <div className="flex-1 h-px bg-bone" />
            <span className="text-[11px] text-slate">{s.orContinueWith}</span>
            <div className="flex-1 h-px bg-bone" />
          </div>

          <SocialLoginRow
            mount={social.mount}
            disabled={social.loading || register.loading}
            className="mb-3 lg:mb-4"
          />
        </motion.div>
      )}
      </>
      )}

      <p className="text-center text-[12px] text-slate mt-3">
        {t.haveAccount}{' '}
        <Button variant="link" size="sm" onClick={() => navigate('/login')} className="font-semibold!">
          {s.signIn}
        </Button>
      </p>
      {/* Covers email and Google sign-up alike. Opens in a new tab so the half-filled form isn't lost. */}
      <p className="text-center text-[11px] text-slate mt-2 leading-[1.5]">
        {t.termsBefore}{' '}
        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal">{t.terms}</a>
        {t.andJoin}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-charcoal">{t.privacy}</a>{t.termsAfter}
      </p>
    </AuthSplitLayout>
  );
}
