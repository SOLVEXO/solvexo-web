import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCreateStore } from '@/hooks/store/useCreateStore';
import { TokenStorage, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { Button } from '@/components/comman/ui/Button';
import {
  Camera, Palette, BookOpen, Store, Briefcase, Monitor, Globe,
  Package, Download, Calendar, Repeat, MonitorSmartphone,
  Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle, Loader2,
  ShieldCheck, CreditCard,
} from 'lucide-react';
import { useUpload } from '@/hooks/upload/useUpload';
import { apiGetEnabledCurrencies, apiSuggestLocation, type SellerType, type ProductType, type StoreData, type SupportedCurrency } from '@/api/services/store';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import {
  apiGetOnboardingProgress, apiSaveOnboardingDraft,
  apiCreateOnboardingSetupIntent, apiConfirmOnboardingPaymentMethod,
  apiGetPublicTrialSettings, apiBrowsePlatformPlans, apiChangePlatformPlan,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { StripeCardSetup, isStripeConfigured } from './StripeCardSetup';
import { PlanCard } from '@/components/comman/ui/PlanCard';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { SellerDashboardMockup } from '@/features/auth/components/mockups/AuthMockups';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { motion } from 'motion/react';

const ONBOARDING_HIGHLIGHTS = [
  { Icon: Store,     text: 'A store built around how you sell' },
  { Icon: Sparkles,  text: 'AI Studio and analytics from day one' },
  { Icon: ShieldCheck, text: 'Verified sellers buyers can trust' },
];

// One short seller-activation journey, Shopify-style — collect only what's
// needed to spin up a real store (name, payment, seller type, what you
// sell), then create it immediately on the last step. No mandatory Review
// step gates account creation (that used to be a 5-step wizard ending in a
// separate Review screen — the store is now created directly off the last
// real step). There is no admin-review queue either — the store
// self-serve-activates immediately on submit (see StoreService.createStore's
// `selfServeActivation`) and automatically starts a real TRIAL_DAYS-day
// trial (see `ensureDefaultSubscription`) EVERY time a store is created —
// per store, not a one-time-per-seller allowance — regardless of whether a
// payment method was ever added.
//
// Payment is real but entirely optional, and lives right after Store Info —
// matching Shopify's own real signup flow (confirmed against a live Shopify
// signup session, not just docs — Shopify shows a skippable billing/card
// screen early in signup, before the rest of the store-setup questions, and
// skipping never blocks the trial or account creation). `Step2Payment`
// (below) collects the seller's own Solvexo subscription card (Stripe
// Elements SetupIntent) — deliberately scoped to ONLY that: connecting
// Stripe so the storefront can accept real customer payments (Stripe
// Connect) is the seller's own setup to do from Store Settings whenever
// they're ready, not something pushed during signup — it's still surfaced
// there and as a Setup Guide task, just not on this screen. Skipping this
// step is never a dead end either way — the trial starts regardless, and the
// Solvexo-billing card task also lives permanently afterwards in the
// dashboard's persistent "Setup Guide" checklist (`SetupGuideCard.tsx`).
const STEPS = ['Store Info', 'Payment', 'Seller Type', 'What You Sell'];
const TOTAL_STEPS = STEPS.length;

// URL-facing slug for each step — mirrors Shopify's own onboarding/signup
// URLs (a per-session id + a real segment identifying where the seller is),
// instead of one flat static `/onboard`. The bare `/onboard` route (see
// `OnboardingEntry` below) mints a fresh session id and redirects into this
// shape immediately. The id itself carries no server-side session state of
// its own — the real resumable state is still the seller's
// backend-persisted draft (`onboardingDraft`, see below) — it exists purely
// so the URL reflects where the seller actually is, the same way Shopify's
// does.
//
// The step lives in the QUERY string (`?step=payment`), not the URL path,
// deliberately — `RootLayout.tsx` keys its page-level `<ErrorBoundary>` by
// `pathname` (app-wide, so any route always remounts cleanly past a caught
// error). `pathname` doesn't include the query string, so putting the step
// there keeps `/onboard/:sessionId` stable across every step change — the
// wizard advances without ever remounting or re-fetching. Putting it in the
// path instead was tried and caused exactly that: every Back/Next/step-click
// change the pathname, so RootLayout remounted the whole page and re-ran its
// draft-resume fetch every time, visible as the page "reloading" repeatedly.
const STEP_SLUGS = ['store-info', 'payment', 'seller-type', 'what-you-sell'];

/** `/onboard` → `/onboard/:sessionId?step=store-info`. A brand new random id
 *  every visit (not tied to the seller's own id — never expose that in a URL). */
export function OnboardingEntry() {
  const [sessionId] = useState(() => crypto.randomUUID());
  return <Navigate to={`/onboard/${sessionId}?step=${STEP_SLUGS[0]}`} replace />;
}

// Every step shares this exact outer width so the progress header (badge +
// bar + circles) renders at the same size on every tab — only the narrower
// steps constrain their inner content below it.
const STEP_WIDTH = 'max-w-[760px]';
const NARROW_CONTENT = 'max-w-[480px] mx-auto';

const SELLER_TYPES: { id: SellerType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'creator',  Icon: Palette,   title: 'Creator',          desc: 'Sell digital art, templates, fonts, music, presets' },
  { id: 'creator',  Icon: BookOpen,  title: 'Educator',         desc: 'Worksheets, lesson plans, curriculum, assessments' },
  { id: 'retailer',      Icon: Store,     title: 'Retailer',         desc: 'Physical goods, handmade products, branded items' },
  { id: 'brand_business', Icon: Briefcase, title: 'Brand / Business', desc: 'Run a full online store with inventory and POS' },
  { id: 'freelancer',    Icon: Monitor,   title: 'Freelancer / Reseller', desc: 'Source and resell products from suppliers' },
  { id: 'mix',      Icon: Globe,     title: 'Mix of the above', desc: 'I sell across multiple categories and formats' },
];

const PRODUCT_TYPES: { id: ProductType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'physical_products', Icon: Package,           title: 'Physical Products',     desc: 'Ship items to customers' },
  { id: 'digital_downloads', Icon: Download,          title: 'Digital Downloads',     desc: 'PDFs, files, audio, video' },
  { id: 'digital_downloads', Icon: BookOpen,          title: 'Educational Resources', desc: 'Worksheets, lesson plans' },
  { id: 'services_bookings', Icon: Calendar,          title: 'Services / Bookings',   desc: 'Appointments and packages' },
  { id: 'subscriptions',     Icon: Repeat,            title: 'Subscriptions',         desc: 'Recurring membership access' },
  { id: 'in_person_pos',     Icon: MonitorSmartphone, title: 'In-Person / POS',       desc: 'Sell at a physical location' },
];

interface StoreForm {
  storeName:    string;
  description:  string;
  logo:         string;
  sellerType:   SellerType | '';
  sellerKey:    string;
  productTypes: ProductType[];
  /** Set automatically (no form field — see DEFAULT_CURRENCY), sent to the
   *  backend as part of store creation. Locked forever once the store has
   *  its first product (see CreateStorePayload.baseCurrency). */
  baseCurrency: SupportedCurrency;
  // Set only if the seller explicitly picks a real plan on Step 2 instead of
  // starting the trial (see Step2Payment) — null means "start the trial",
  // exactly like today. Never sent as part of store creation itself; applied
  // via the same PATCH :storeId/change-plan call the Billing Center already
  // uses for a mid-trial purchase (billImmediately: true), right after the
  // store (and its normal trial subscription) is created — see
  // handleFinalSubmit. This reuses the exact same, already-tested "buy a
  // plan mid-trial → trial ends immediately, real charge now" code path,
  // instead of a second, parallel billing implementation.
  selectedPlanId: string | null;
}

// Fallback only — Step1StoreInfo now shows a real picker (populated from the
// platform's dynamic Markets list, apiGetEnabledCurrencies) pre-selected from
// the seller's IP-detected country (apiSuggestLocation), so this constant
// only matters for the brief window before either call resolves.
const DEFAULT_CURRENCY: SupportedCurrency = 'PKR';

// Fades/lifts a step's content in whenever `step` changes, for a smoother
// transition between onboarding steps without a page-level animation library.
function StepPane({ step, children }: { step: number; children: ReactNode }) {
  const [prevStep, setPrevStep] = useState(step);
  const [visible, setVisible] = useState(true);

  // Reset the fade when `step` changes (adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect — avoids the extra
  // render + effect cascade of doing this synchronously inside useEffect).
  if (step !== prevStep) {
    setPrevStep(step);
    setVisible(false);
  }

  useEffect(() => {
    if (visible) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <div className={clsx(
      'w-full flex justify-center transition-all duration-300 ease-out',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
    )}>
      {children}
    </div>
  );
}

// ── Step 1 — Store Info ───────────────────────────────────────────────────────
function Step1StoreInfo({ form, setForm, onNext }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void;
}) {
  const [preview, setPreview] = useState('');
  const canProceed = form.storeName.trim().length > 0;
  const { upload: uploadLogo, uploading: logoUploading } = useUpload('public');
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([]);
  // Tracks whether the seller has manually touched the currency picker —
  // the IP-detected suggestion below is only ever applied as a pre-fill, and
  // must stop overwriting the field the instant a real choice is made.
  const [currencyTouched, setCurrencyTouched] = useState(false);
  // Mirrors the latest `form`/`currencyTouched` for the async fetches below —
  // both fire once on mount and may resolve after the seller has already
  // started typing other fields, so they must never merge against a stale
  // closure of `form` and clobber it.
  const latestRef = useRef({ form, currencyTouched });
  latestRef.current.form = form;
  latestRef.current.currencyTouched = currencyTouched;

  useEffect(() => {
    apiGetEnabledCurrencies()
      .then(res => {
        const codes = res.data.map(c => c.code);
        setCurrencyOptions(codes);
        // Default to the first real platform currency if the current value
        // (DEFAULT_CURRENCY) isn't actually enabled — never leave the form
        // pointed at a currency the platform doesn't support.
        const { form: f, currencyTouched: touched } = latestRef.current;
        if (!touched && codes.length > 0 && !codes.includes(f.baseCurrency)) {
          setForm({ ...f, baseCurrency: codes[0] });
        }
      })
      .catch(() => {}); // fail open — keeps the built-in default, still changeable manually
    // Suggestion only, never enforced — pre-fills the picker from the
    // seller's IP-detected country if that currency is genuinely enabled.
    apiSuggestLocation()
      .then(res => {
        const suggested = res.data.suggestedCurrency;
        const { form: f, currencyTouched: touched } = latestRef.current;
        if (suggested && !touched) {
          setForm({ ...f, baseCurrency: suggested });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    uploadLogo(file)
      .then(data => setForm({ ...form, logo: data.url }))
      .catch(() => setPreview(''));
  };

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className={clsx(NARROW_CONTENT, 'text-center mb-9')}>
        <h1 className="text-[28px] font-bold text-carbon mb-2">Set up your store</h1>
        <p className="text-[14px] text-slate">You can always update these details later from Settings.</p>
      </div>
      <div className={NARROW_CONTENT}>
        <div className="flex gap-5 items-center p-4 bg-cream rounded-xl mb-6">
          <label className={clsx(
            'size-[72px] rounded-2xl bg-brand-pale-orange border-2 border-dashed border-brand-orange flex items-center justify-center shrink-0 overflow-hidden',
            logoUploading ? 'cursor-wait opacity-60' : 'cursor-pointer',
          )}>
            {logoUploading
              ? <Loader2 size={28} className="text-brand-orange animate-spin" />
              : preview
                ? <img loading="lazy" decoding="async" src={preview} alt="logo" className="w-full h-full object-cover" />
                : <Camera size={28} className="text-brand-orange" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} disabled={logoUploading} />
          </label>
          <div>
            <p className="text-[13px] font-semibold text-carbon mb-1">Store Logo</p>
            <p className="text-[12px] text-slate">PNG, JPG or WebP. Click to upload.</p>
            {logoUploading && <p className="text-[11px] text-brand-orange mt-1">Uploading…</p>}
            {!logoUploading && form.logo && <p className="text-[11px] text-success mt-1">✓ Logo uploaded</p>}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="onboard-store-name" className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Name <span className="text-brand-orange">*</span></label>
          <input id="onboard-store-name" placeholder="e.g. Creative Classroom Resources"
            value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white transition-[border-color,box-shadow] duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10" />
          {form.storeName && (
            <p className="text-[11px] text-slate mt-[5px]">
              Your store URL will look like: <span className="text-brand-orange">
                {getStorefrontUrl(form.storeName.toLowerCase().replace(/\s+/g, '-')).replace(/^https?:\/\//, '')}
              </span>
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="onboard-description" className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Description <span className="text-slate font-normal">(optional)</span></label>
          <textarea id="onboard-description" placeholder="Tell buyers what makes your store special..."
            rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y transition-[border-color,box-shadow] duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10" />
        </div>

        <div className="mb-6">
          <label htmlFor="onboard-currency" className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Currency <span className="text-brand-orange">*</span></label>
          <select id="onboard-currency" value={form.baseCurrency}
            onChange={e => { setCurrencyTouched(true); setForm({ ...form, baseCurrency: e.target.value }); }}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white transition-[border-color,box-shadow] duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
            {!currencyOptions.includes(form.baseCurrency) && (
              <option value={form.baseCurrency}>{form.baseCurrency}</option>
            )}
            {currencyOptions.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
          <p className="text-[11px] text-slate mt-[5px]">
            All your product prices will be set in this currency. It's locked once your store has its first product.
          </p>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => canProceed && onNext()} disabled={!canProceed}>
          Continue <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2 — Choose how to get started (stays in the narrow wizard column) ─────
// Just the trial default + a single "Or choose a plan now" entry point.
// Actually browsing/paying for a real plan happens on a genuine full-screen
// page (`PlansFullPage`, below) opened via `onOpenPlans` — rendered by
// `OnboardingPage` completely outside the wizard's split-screen layout, not
// squeezed into this narrow column. Skipping — or completing either path —
// never blocks anything: every store gets its own real trial regardless (see
// ensureDefaultSubscription on the backend) unless the seller explicitly
// picks and pays for a plan on that full page, in which case the trial is
// skipped entirely for that store (see handleFinalSubmit).
function Step2Payment({ form, onNext, onBack, trialDurationDays, plans, onOpenPlans }: {
  form: StoreForm; onNext: () => void; onBack: () => void; trialDurationDays: number;
  plans: PlatformPlan[]; onOpenPlans: () => void;
}) {
  const selectedPlan = form.selectedPlanId ? plans.find(p => p._id === form.selectedPlanId) ?? null : null;
  const hasSelectablePlans = plans.some(p => !p.isCustomPricing);

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className={NARROW_CONTENT}>
        <div className="mb-7 text-center">
          <h1 className="text-[28px] font-bold text-carbon mb-2">Choose how to get started</h1>
          <p className="text-[14px] text-slate">
            Start free and decide later, or pick a plan now if you already know what you need.
          </p>
        </div>

        <div className={clsx(
          'rounded-xl border-2 px-[18px] py-[16px] mb-4',
          !selectedPlan ? 'border-brand-orange bg-brand-pale-orange/30' : 'border-bone',
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-bold text-carbon mb-[2px]">Start with a free {trialDurationDays}-day trial</p>
              <p className="text-[12px] text-slate">Full platform access, no card needed. Choose a plan any time before or after your trial ends.</p>
            </div>
            <div className={clsx('size-5 rounded-full border-2 flex items-center justify-center shrink-0', !selectedPlan ? 'border-brand-orange bg-brand-orange' : 'border-bone')}>
              {!selectedPlan && <Check size={10} className="text-white" />}
            </div>
          </div>
        </div>

        {selectedPlan ? (
          <div className="rounded-xl border-2 border-brand-orange bg-brand-pale-orange/30 px-[18px] py-[16px] mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-bold text-carbon mb-[2px]">
                  {selectedPlan.name}
                  {selectedPlan.badge && <span className="ml-2 text-[10px] font-semibold text-brand-deep-orange bg-white px-[7px] py-[2px] rounded-full align-middle">{selectedPlan.badge}</span>}
                </p>
                <p className="text-[12px] text-slate">
                  {selectedPlan.isFree ? 'Free forever — active immediately, no trial.' : `$${selectedPlan.monthlyPriceUSD}/mo — payment confirmed, no trial.`}
                </p>
              </div>
              <button type="button" onClick={onOpenPlans} className="text-[12px] font-semibold text-brand-orange hover:text-brand-deep-orange shrink-0">
                Change
              </button>
            </div>
          </div>
        ) : hasSelectablePlans ? (
          <button
            type="button"
            onClick={onOpenPlans}
            className="w-full rounded-xl border-2 border-dashed border-bone hover:border-brand-orange/50 px-[18px] py-[16px] mb-6 text-left cursor-pointer transition-colors duration-150 bg-transparent"
          >
            <p className="text-[13.5px] font-bold text-carbon mb-[2px]">Or choose a plan now</p>
            <p className="text-[12px] text-slate">Browse plans and pay right away — skip the trial entirely.</p>
          </button>
        ) : null}

        <div className="flex items-start justify-end mb-5">
          <button type="button" onClick={onNext} className="text-[12.5px] font-semibold text-slate hover:text-carbon shrink-0">
            Skip — decide later
          </button>
        </div>

        <div className="flex gap-[10px]">
          <Button variant="ghost" size="md" onClick={onBack} className="shrink-0">
            <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
          </Button>
          <MagneticButton className="flex-1">
            <Button variant="primary" size="lg" fullWidth onClick={onNext}>
              Continue <ArrowRight size={14} className="inline align-middle ml-1" />
            </Button>
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}

// ── Full-screen "Choose a plan" page ────────────────────────────────────────────
// Opened from Step 2's "Or choose a plan now" — rendered by `OnboardingPage`
// completely OUTSIDE the wizard's `AuthSplitLayout` split-screen column, as a
// real full-viewport page (`fixed inset-0`), so it can show the exact same
// wide, multi-column `PlanCard` grid + billing toggle the public Pricing page
// uses, at full size — never squeezed into a ~480px wizard column. Two
// internal phases: browsing the grid, and (once a paid plan is tapped) a
// focused card-entry screen for that one plan. Selecting a plan here (paying
// for it, if it's not free) closes back to the wizard step with the choice
// applied; "Back to onboarding" with nothing chosen leaves the trial default
// untouched.
function PlansFullPage({ plans, trialDurationDays, selectedPlanId, onClose, onConfirmPlan }: {
  plans: PlatformPlan[]; trialDurationDays: number; selectedPlanId: string | null;
  onClose: () => void; onConfirmPlan: (planId: string) => void;
}) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [payingPlan, setPayingPlan] = useState<PlatformPlan | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [intentError, setIntentError] = useState('');
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const stripeReady = isStripeConfigured();
  const selectablePlans = plans.filter(p => !p.isCustomPricing).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!stripeReady || !payingPlan) return;
    let cancelled = false;
    apiCreateOnboardingSetupIntent()
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(() => { if (!cancelled) setIntentError('Could not load the card form right now — try again, or go back and start with the free trial instead.'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeReady, payingPlan?._id]);

  const pickPlan = (plan: PlatformPlan) => {
    if (plan.isFree) { onConfirmPlan(plan._id); return; }
    setPayingPlan(plan);
    setClientSecret(''); setIntentError(''); setCardConfirmed(false);
  };

  const handleConfirmed = async (setupIntentId: string) => {
    setConfirming(true);
    try {
      await apiConfirmOnboardingPaymentMethod(setupIntentId);
      setCardConfirmed(true);
    } catch {
      setIntentError('We saved your card with Stripe, but could not confirm it on our side — try again.');
    } finally {
      setConfirming(false);
    }
  };

  // `data-lenis-prevent` — this page renders `fixed`, outside RootLayout's
  // normal document flow, so it never contributes to the global Lenis
  // smooth-scroll wrapper's `scrollHeight` (see SmoothScroll.tsx). Without
  // this attribute Lenis still intercepts every wheel/touch event over this
  // whole viewport-covering overlay and tries to scroll that (now-empty)
  // outer container instead — native scroll on THIS div's own
  // `overflow-y-auto` never runs, which is exactly why the page didn't
  // scroll before this was added. Lenis's own documented escape hatch for a
  // nested, independently-scrollable region.
  return (
    <div className="fixed inset-0 z-50 bg-cream overflow-y-auto" data-lenis-prevent>
      {payingPlan ? (
        <div className="max-w-[480px] mx-auto px-4 pt-6 pb-12">
          <button
            type="button"
            onClick={() => setPayingPlan(null)}
            className="text-[12.5px] font-semibold text-slate hover:text-carbon inline-flex items-center gap-1.5 mb-5"
          >
            <ArrowLeft size={13} /> Back to plans
          </button>
          <div className="mb-7">
            <h1 className="text-[24px] font-bold text-carbon mb-2">Pay for {payingPlan.name}</h1>
            <p className="text-[13.5px] text-slate leading-[1.6]">
              {payingPlan.introOfferEnabled && payingPlan.introPriceUSD != null && payingPlan.introDurationCycles != null
                ? `You'll be charged $${payingPlan.introPriceUSD} right now, then $${payingPlan.monthlyPriceUSD}/mo after ${payingPlan.introDurationCycles} month${payingPlan.introDurationCycles === 1 ? '' : 's'} — no trial.`
                : `You'll be charged $${payingPlan.monthlyPriceUSD}/mo right now — no trial.`}
            </p>
          </div>

          <div className="rounded-xl border border-bone bg-white px-[18px] py-[16px] mb-6">
            {cardConfirmed ? (
              <div className="flex items-center gap-2 rounded-lg bg-success-bg px-[14px] py-[12px]">
                <ShieldCheck size={16} className="text-success shrink-0" />
                <p className="text-[12.5px] text-success">Card confirmed — you'll launch directly on {payingPlan.name}.</p>
              </div>
            ) : stripeReady ? (
              clientSecret ? (
                <div>
                  <StripeCardSetup clientSecret={clientSecret} onConfirmed={handleConfirmed} />
                  {confirming && <p className="text-[11px] text-slate mt-2">Confirming…</p>}
                </div>
              ) : intentError ? (
                <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] text-[12.5px] text-error">
                  <AlertTriangle size={14} className="shrink-0" /> {intentError}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="text-brand-orange animate-spin" />
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[10px] text-[12.5px] text-slate">
                <CreditCard size={14} className="shrink-0" /> Card setup isn't available right now — go back and start with the free trial instead.
              </div>
            )}
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={() => onConfirmPlan(payingPlan._id)} disabled={!cardConfirmed}>
            Confirm & Continue <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      ) : (
        <div className="px-4 md:px-8 lg:px-12 pt-6 pb-16 max-w-[1200px] mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-semibold text-slate hover:text-carbon inline-flex items-center gap-1.5 mb-6"
          >
            <ArrowLeft size={13} /> Back to onboarding
          </button>
          <div className="text-center max-w-[640px] mx-auto mb-10">
            <h1 className="text-[28px] md:text-[34px] font-bold text-carbon mb-3">Choose your plan</h1>
            <p className="text-[14px] text-slate">
              Pick a plan and pay right away to skip the {trialDurationDays}-day trial — or go back and start free.
            </p>
          </div>

          {selectablePlans.some(p => !p.isFree) && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-bone rounded-[10px] p-1" role="group" aria-label="Billing interval">
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} type="button" onClick={() => setBilling(b)} aria-pressed={billing === b}
                    className={clsx('px-6 py-2 rounded-lg cursor-pointer flex items-center gap-[6px] transition-all duration-200 border-0', billing === b ? 'bg-white' : 'bg-transparent')}>
                    <span className={clsx('text-[13px] capitalize', billing === b ? 'font-semibold text-carbon' : 'font-normal text-slate')}>{b}</span>
                    {b === 'annual' && <span className="text-[10px] font-semibold text-success">Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {selectablePlans.map(plan => (
              <PlanCard
                key={plan._id}
                plan={plan}
                billing={billing}
                selected={selectedPlanId === plan._id}
                ctaLabel={plan.isFree ? 'Select — Free' : 'Select & Pay'}
                onCta={() => pickPlan(plan)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Seller Type ──────────────────────────────────────────────────────
function Step3SellerType({ form, setForm, onNext, onBack }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className="text-center mb-9">
        <h1 className="text-[28px] font-bold text-carbon mb-2">What kind of seller are you?</h1>
        <p className="text-[14px] text-slate">We'll personalise your dashboard and tools based on your answer.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mb-7">
        {SELLER_TYPES.map((t, idx) => {
          const selKey = `${t.id}-${idx}`;
          const isSelected = form.sellerKey === selKey;
          return (
            <div key={selKey} onClick={() => setForm({ ...form, sellerType: t.id, sellerKey: selKey })}
              className={clsx(
                'rounded-[14px] p-5 border-2 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0',
                isSelected ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <t.Icon size={32} />
                <div className={clsx(
                  'size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200',
                  isSelected ? 'border-brand-orange bg-brand-orange' : 'border-bone bg-white',
                )}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              </div>
              <p className="text-[14px] font-bold text-carbon mb-1">{t.title}</p>
              <p className="text-[11px] text-slate leading-[1.5]">{t.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[10px]">
        <Button variant="ghost" size="md" onClick={onBack} className="shrink-0">
          <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
        </Button>
        <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={() => form.sellerType && onNext()} disabled={!form.sellerType}>
          {form.sellerType ? <span>Continue <ArrowRight size={14} className="inline align-middle ml-1" /></span> : 'Select one to continue'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — What You Sell (final step — launches the store directly) ────────
// Used to be a "Continue" step that fed into a separate Review screen; now
// that store creation happens right after this step, it owns the submit
// action itself — same flat, no-boxed-sub-panel treatment the old Review
// step used for its launch confirmation and error messaging.
function Step4WhatYouSell({ form, setForm, onBack, submitting, submitError, onSubmit, trialDurationDays, plans }: {
  form: StoreForm; setForm: (f: StoreForm) => void;
  onBack: () => void;
  submitting: boolean; submitError: string; onSubmit: () => void;
  trialDurationDays: number; plans: PlatformPlan[];
}) {
  const toggle = (id: ProductType) =>
    setForm({ ...form, productTypes: form.productTypes.includes(id) ? form.productTypes.filter(x => x !== id) : [...form.productTypes, id] });
  const selectedPlan = form.selectedPlanId ? plans.find(p => p._id === form.selectedPlanId) : null;

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className="text-center mb-9">
        <h1 className="text-[28px] font-bold text-carbon mb-2">What will you sell?</h1>
        <p className="text-[14px] text-slate">Select all that apply — we'll activate the right tools for you.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mb-7">
        {PRODUCT_TYPES.map((t, idx) => {
          const on = form.productTypes.includes(t.id);
          return (
            <div key={idx} onClick={() => toggle(t.id)}
              className={clsx(
                'rounded-[14px] px-4 py-[18px] border-2 cursor-pointer transition-all duration-200 ease-out relative hover:-translate-y-0.5 active:translate-y-0',
                on ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
              )}
            >
              {on && (
                <div className="absolute top-[10px] right-[10px] size-5 rounded-full bg-brand-orange flex items-center justify-center transition-transform duration-200">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <t.Icon size={30} className="block mb-[10px]" />
              <p className="text-[13px] font-bold text-carbon mb-1">{t.title}</p>
              <p className="text-[11px] text-slate">{t.desc}</p>
            </div>
          );
        })}
      </div>

      {form.productTypes.length > 0 && (
        <div className="bg-brand-pale-orange rounded-xl px-[18px] py-[14px] mb-5 flex gap-3 items-start">
          <Sparkles size={18} className="text-brand-deep-orange shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-brand-deep-orange mb-[6px]">We'll activate these tools for you:</p>
            <div className="flex gap-[6px] flex-wrap">
              {form.productTypes.includes('physical_products') && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Inventory Manager</span>}
              {form.productTypes.includes('digital_downloads')     && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Digital Delivery</span>}
              {form.productTypes.includes('educational_resources') && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">AI Worksheet Builder</span>}
              {form.productTypes.includes('in_person_pos')     && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">POS Register</span>}
              {form.productTypes.includes('services_bookings') && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Bookings</span>}
              <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">AI Studio</span>
              <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Marketplace</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-left mb-5 bg-success-bg rounded-xl px-[14px] py-[12px]">
        <ShieldCheck size={16} className="text-success shrink-0 mt-[1px]" />
        <p className="text-[12.5px] text-success leading-[1.6]">
          {selectedPlan
            ? `Your store goes live immediately — no waiting on review. You'll launch directly on the ${selectedPlan.name} plan, no trial.`
            : `Your store goes live immediately — no waiting on review, no card needed. Your free ${trialDurationDays}-day trial starts the moment you launch.`}
        </p>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 text-left mb-4">
          <AlertTriangle size={14} className="text-error shrink-0 mt-[2px]" />
          <p className="text-[12.5px] text-error leading-[1.6]">{submitError}</p>
        </div>
      )}

      <div className="flex gap-[10px]">
        <Button variant="ghost" size="md" onClick={onBack} className="shrink-0" disabled={submitting}>
          <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
        </Button>
        <MagneticButton className="flex-1">
          <Button variant="primary" size="lg" fullWidth
            onClick={() => form.productTypes.length > 0 && onSubmit()}
            loading={submitting}
            disabled={form.productTypes.length === 0}>
            {form.productTypes.length > 0 ? 'Launch My Store' : 'Select at least one'}
          </Button>
        </MagneticButton>
      </div>
    </div>
  );
}

// ── Terminal state — store created and live ───────────────────────────────────
// Same flat, no-card treatment as the old Review step used to have.
function StoreReadyConfirmation({ store, planWarning }: { store: StoreData | null; planWarning: string }) {
  const navigate = useNavigate();
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className={clsx(NARROW_CONTENT, 'text-center')}>
        <motion.div
          className="size-14 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Check size={26} className="text-success" />
        </motion.div>
        <h1 className="text-[28px] font-bold text-carbon mb-[10px]">Your store is live!</h1>
        <p className="text-[14px] text-slate leading-[1.7] mb-7 max-w-[420px] mx-auto">
          {store?.name || 'Your store'} is ready on Solvexo — start adding products and customizing your storefront right away.
        </p>
        {planWarning && (
          <div className="flex items-start gap-2 text-left mb-6 bg-error-bg rounded-xl px-[14px] py-[12px] max-w-[420px] mx-auto">
            <AlertTriangle size={15} className="text-error shrink-0 mt-[1px]" />
            <p className="text-[12.5px] text-error leading-[1.6]">{planWarning}</p>
          </div>
        )}
        <MagneticButton className="block">
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/store/${store?._id}/dashboard`, { replace: true })}>
            Go to My Store Dashboard <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </MagneticButton>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  usePageTitle('Onboarding');
  const createStore = useCreateStore();
  const navigate = useNavigate();
  // Falls back to a fresh id if this page is ever reached without one
  // (defensive only — the router always routes here via OnboardingEntry).
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>();
  const [sessionId] = useState(() => routeSessionId || crypto.randomUUID());
  const [step, setStep]         = useState(1);
  // Only the setter is read directly — the current value still flows into
  // `saveDraft` (so resuming a reload restores the right furthest-reached
  // step on the backend), but nothing renders it any more now that the
  // step-progress indicator (and its click-to-jump-back affordance) is gone.
  const [, setMaxReached] = useState(1);
  // 'wizard' → the 4-step form (Store Info, Payment, Seller Type, What You
  // Sell — Payment is inline as step 2 now, not a separate post-creation
  // phase); 'ready' → the final "Your store is live" confirmation, shown
  // directly once the last step submits.
  const [phase, setPhase] = useState<'wizard' | 'ready'>('wizard');
  // A genuine full-screen page, not a step — opened from Step 2's "Or choose
  // a plan now" and rendered completely outside the wizard's split-screen
  // layout (see the render branch below, right after the `phase === 'ready'`
  // one) so the plan grid gets real full-page width instead of the narrow
  // wizard column.
  const [showPlansPage, setShowPlansPage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [planWarning, setPlanWarning] = useState('');
  const [form, setForm] = useState<StoreForm>({
    storeName: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [], baseCurrency: DEFAULT_CURRENCY,
    selectedPlanId: null,
  });
  // Real published plans, fetched once — feeds Step2Payment's plan picker and
  // Step4's/the ready screen's "you'll launch on X" copy. Same public
  // endpoint the Pricing page uses.
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  useEffect(() => {
    apiBrowsePlatformPlans().then(res => setPlans(res.data)).catch(() => {});
  }, []);
  // Resumability — a reload/lost connection/different device shouldn't send
  // the seller back to step 1 with everything they've typed gone. Loaded
  // once on mount from the backend (not localStorage, so it survives a
  // browser switch too).
  const [progressLoading, setProgressLoading] = useState(true);
  // Real admin-configured value (Trial Settings) — never hardcoded, so a
  // duration change in the admin panel is reflected here with no deploy.
  // 3 is only the safe fallback while this hasn't loaded yet or the request
  // fails — matches the backend's own hardcoded fallback constant.
  const [trialDurationDays, setTrialDurationDays] = useState(3);

  useEffect(() => {
    apiGetPublicTrialSettings()
      .then(res => setTrialDurationDays(res.data.durationDays))
      .catch(() => {}); // keep the fallback — never block onboarding over this
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGetOnboardingProgress()
      .then(res => {
        if (cancelled) return;
        const { draft } = res.data;
        if (draft) {
          // Clamp against a draft saved under a since-changed step count/order
          // (e.g. the old 3-step wizard, or the older 5-step one before that)
          // — a seller who reloads mid-onboarding after a step-order change
          // deploys could otherwise resume onto a step index that no longer
          // exists, or lands on the wrong step's slug in the URL.
          const resumeStep = Math.min(draft.step, TOTAL_STEPS);
          const resumeMax  = Math.min(draft.maxReached, TOTAL_STEPS);
          setStep(resumeStep);
          setMaxReached(resumeMax);
          setForm(prev => ({ ...prev, ...(draft.form as Partial<StoreForm>) }));
          // Resumed onto a later step than the entry redirect assumed —
          // correct the URL's step query param to match (e.g. reload mid-wizard).
          navigate(`/onboard/${sessionId}?step=${STEP_SLUGS[resumeStep - 1]}`, { replace: true });
        }
      })
      // A failed resume-check isn't fatal — the wizard just starts fresh.
      .catch(() => {})
      .finally(() => { if (!cancelled) setProgressLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store setup is a seller-only flow — a logged-out visitor is sent to
  // /login (redirect back here after), and a logged-in buyer is sent to
  // their own home instead of ever seeing seller store setup. Placed after
  // every hook call above (same convention as StoreLayout's role guard) so
  // this early return never changes the hook count between renders.
  const user = TokenStorage.getUser<{ role?: AppRole }>();
  if (!TokenStorage.isLoggedIn()) {
    return <Navigate to="/login?redirect=/onboard" replace />;
  }
  if (user?.role && user.role !== 'seller') {
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  // Saved on every forward step transition (not on every keystroke) — enough
  // to survive a reload without saving on every field change.
  const saveDraft = (nextStep: number, nextMaxReached: number) => {
    apiSaveOnboardingDraft({ step: nextStep, maxReached: nextMaxReached, form: form as unknown as Record<string, unknown> }).catch(() => {});
  };
  // Every step change also rewrites the URL's `?step=` query param (replace,
  // not push — matches Shopify's own behavior of not stacking a browser-
  // history entry per wizard step) so the URL always reflects where the
  // seller actually is, WITHOUT touching `pathname` (see the STEP_SLUGS
  // comment above for why that distinction matters here).
  const goToUrlStep = (n: number) => navigate(`/onboard/${sessionId}?step=${STEP_SLUGS[n - 1]}`, { replace: true });
  const next = () => {
    setStep(s => {
      const n = Math.min(s + 1, TOTAL_STEPS);
      setMaxReached(m => { const newMax = Math.max(m, n); saveDraft(n, newMax); return newMax; });
      goToUrlStep(n);
      return n;
    });
  };
  const back   = () => setStep(s => { const n = Math.max(s - 1, 1); goToUrlStep(n); return n; });

  // The ONE place the store gets created — right after step 4, the last step
  // now that Review is gone. Store creation and the automatic per-store
  // trial are unconditional (see StoreService.createStore's
  // `selfServeActivation` and `ensureDefaultSubscription`) — no
  // `platformPlanId` is sent as part of the create-store call itself, so the
  // store always starts on its normal trial first, exactly like before.
  //
  // If the seller picked a real plan on Step 2 (`form.selectedPlanId`), the
  // ALREADY-EXISTING mid-trial "buy a plan now" endpoint (PATCH
  // :storeId/change-plan, billImmediately: true) is called right after —
  // this is the exact same code path the Billing Center uses for a mid-trial
  // purchase, so it reuses all its tested proration/Stripe-charge/webhook
  // logic instead of a second, parallel implementation. The card was already
  // confirmed against the seller's Stripe customer in Step2Payment, so
  // Stripe charges it immediately and the trial ends right there — matching
  // the platform-wide "trial and a paid plan never coexist" rule. A failed
  // charge here does NOT fail the whole store creation — the store still
  // exists, just left on its normal trial, and the seller sees a clear
  // warning on the next screen instead of a dead end.
  const handleFinalSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      let store = createStore.store;
      if (!store) {
        store = await createStore.execute({
          name:         form.storeName,
          logo:         form.logo || undefined,
          description:  form.description,
          sellerType:   form.sellerType as SellerType,
          productTypes: [...new Set(form.productTypes)],
          baseCurrency: form.baseCurrency,
        });
        if (!store) { setSubmitError(createStore.error || 'Failed to create store. Please try again.'); return; }
      }
      if (form.selectedPlanId) {
        const plan = plans.find(p => p._id === form.selectedPlanId);
        try {
          await apiChangePlatformPlan(store._id, form.selectedPlanId, 'monthly');
        } catch (err) {
          setPlanWarning(
            `We couldn't complete your ${plan?.name ?? 'plan'} payment (${err instanceof Error ? err.message : 'card declined'}) — your store is live on the free trial instead. You can try again any time from Billing.`,
          );
        }
      }
      setPhase('ready');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create store. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Brief — just long enough to know whether to resume a draft — but real,
  // to avoid flashing an empty step 1 before a resumed draft overwrites it.
  if (progressLoading) {
    return (
      <AuthSplitLayout
        panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
        pageContext="onboarding"
        heading="Your store, your way."
        subtext="A few quick steps and your store goes live — no waiting on review."
        highlights={ONBOARDING_HIGHLIGHTS}
        visual={<SellerDashboardMockup />}
        bare
      >
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <Loader2 size={24} className="text-brand-orange animate-spin" />
        </div>
      </AuthSplitLayout>
    );
  }

  if (phase === 'ready') {
    return (
      <AuthSplitLayout
        panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
        pageContext="onboarding"
        heading="You're all set."
        subtext="Your store is live on Solvexo — start building your storefront right away."
        highlights={ONBOARDING_HIGHLIGHTS}
        visual={<SellerDashboardMockup />}
        bare
      >
        <div className="flex-1 flex items-start justify-center px-6 py-6">
          <StoreReadyConfirmation store={createStore.store} planWarning={planWarning} />
        </div>
      </AuthSplitLayout>
    );
  }

  if (showPlansPage) {
    return (
      <PlansFullPage
        plans={plans}
        trialDurationDays={trialDurationDays}
        selectedPlanId={form.selectedPlanId}
        onClose={() => setShowPlansPage(false)}
        onConfirmPlan={planId => { setForm({ ...form, selectedPlanId: planId }); setShowPlansPage(false); }}
      />
    );
  }

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      pageContext="onboarding"
      heading="Your store, your way."
      subtext="A few quick steps and your store goes live — no waiting on review."
      highlights={ONBOARDING_HIGHLIGHTS}
      visual={<SellerDashboardMockup />}
      bare
    >
      <div className="flex-1 flex items-start justify-center px-6 py-6">
        <StepPane step={step}>
          {step === 1 && <Step1StoreInfo form={form} setForm={setForm} onNext={next} />}
          {step === 2 && (
            <Step2Payment
              form={form} onNext={next} onBack={back} trialDurationDays={trialDurationDays} plans={plans}
              onOpenPlans={() => setShowPlansPage(true)}
            />
          )}
          {step === 3 && <Step3SellerType form={form} setForm={setForm} onNext={next} onBack={back} />}
          {step === 4 && (
            <Step4WhatYouSell
              form={form} setForm={setForm} onBack={back}
              submitting={submitting} submitError={submitError} onSubmit={handleFinalSubmit}
              trialDurationDays={trialDurationDays} plans={plans}
            />
          )}
        </StepPane>
      </div>
    </AuthSplitLayout>
  );
}
