import { useState, useEffect, type ReactNode } from 'react';
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
import type { SellerType, ProductType, StoreData, SupportedCurrency } from '@/api/services/store';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import {
  apiGetOnboardingProgress, apiSaveOnboardingDraft,
  apiBrowsePlatformPlans, apiCreateOnboardingSetupIntent, apiConfirmOnboardingPaymentMethod,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { StripeCardSetup, isStripeConfigured } from './StripeCardSetup';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { SellerDashboardMockup } from '@/features/auth/components/mockups/AuthMockups';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { motion } from 'motion/react';

const ONBOARDING_HIGHLIGHTS = [
  { Icon: Store,     text: 'A store built around how you sell' },
  { Icon: Sparkles,  text: 'AI Studio and analytics from day one' },
  { Icon: ShieldCheck, text: 'Verified sellers buyers can trust' },
];

// One continuous seller-activation journey, Shopify-style — store setup,
// payment, seller profile, and what-you-sell are all steps of the SAME
// wizard, and the store itself only ever gets created once, at the very
// last step. There is no admin-review queue — the store self-serve-activates
// immediately on submit (see StoreService.createStore's `selfServeActivation`)
// and automatically starts a 3-day trial (see `ensureDefaultSubscription`)
// regardless of whether a card was added below.
//
// The Payment step (step 2) IS shown to every seller, matching Shopify's own
// real signup flow (confirmed against a live Shopify signup session, not just
// docs — Shopify shows a billing/card screen with a plain "Skip" link at the
// top-right during signup; skipping never blocks the trial or account
// creation). Card entry here is real Stripe (SetupIntent, no charge) and is
// entirely optional — a seller can Skip and add a card later from the
// store's own Billing page (`StorePlanBilling.tsx`), which is also where a
// plan can be changed at any time after the store exists.
const STEPS = ['Store Info', 'Payment', 'Seller Type', 'What You Sell', 'Review'];
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
const STEP_SLUGS = ['store-info', 'payment', 'seller-type', 'what-you-sell', 'review'];

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
  /** Chosen (or left blank) on the Payment step — optional; the backend
   *  falls back to the cheapest real plan for the trial if omitted. */
  platformPlanId: string;
}

// Solvexo is Pakistan-origin, so every store defaults to PKR pricing
// automatically — no picker shown during onboarding. A real IP/locale-based
// default can replace this constant later without touching anything else,
// since the rest of the app only ever reads `store.baseCurrency`.
const DEFAULT_CURRENCY: SupportedCurrency = 'PKR';

// ── Step Progress header — lives inside each step's card, same badge +
// progress-line + circle treatment as CheckoutPage's step header, instead of
// a standalone bar pinned above the card.
function OnboardingStepHeader({ step, maxReached, onStepClick }: { step: number; maxReached: number; onStepClick: (step: number) => void }) {
  return (
    <div className="pb-4 mb-7 border-b border-bone">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-bold text-carbon">{STEPS[step - 1]}</p>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-brand-pale-orange text-brand-orange">
          Step {step} of {STEPS.length}
        </span>
      </div>
      <div className="relative flex justify-between items-start w-full">
        <div className="absolute top-3 left-0 right-0 h-[2px] bg-bone rounded-full" />
        <div
          className="absolute top-3 left-0 h-[2px] bg-brand-orange rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n <= maxReached && n !== step;
          const active = n === step;
          const clickable = n <= maxReached && n !== step;
          return (
            <div
              key={n}
              className={clsx('relative z-10 flex flex-col items-center gap-[6px]', clickable ? 'cursor-pointer' : 'cursor-default')}
              onClick={() => clickable && onStepClick(n)}
            >
              <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200',
                done ? 'bg-success text-white' :
                  active ? 'bg-brand-orange text-white ring-4 ring-brand-pale-orange' :
                    'bg-bone text-slate',
              )}>
                {done ? <Check size={12} /> : n}
              </div>
              <span className={clsx(
                'hidden sm:block text-[10px] font-semibold whitespace-nowrap',
                active ? 'text-brand-orange' : done ? 'text-success' : 'text-slate',
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
function Step1StoreInfo({ form, setForm, onNext, step, maxReached, onStepClick }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  const [preview, setPreview] = useState('');
  const canProceed = form.storeName.trim().length > 0;
  const { upload: uploadLogo, uploading: logoUploading } = useUpload('public');

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
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
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

        <Button variant="primary" size="lg" fullWidth onClick={() => canProceed && onNext()} disabled={!canProceed}>
          Continue <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2 — Payment (real Stripe card, entirely optional) ────────────────────
// Mirrors the real Shopify signup screen: a plain, low-weight "Skip" link at
// the top-right (never a decision-styled "Skip for now — start trial"
// button), a short trial-terms strip, and a real Stripe card form. Skipping
// or closing this step never blocks store creation or the trial — both are
// unconditional. `alreadyConfirmed` (from the resumed draft's
// hasPlatformPaymentMethod) skips re-fetching a SetupIntent and shows a
// simple confirmation instead of the card form again.
function Step2Payment({ form, setForm, onNext, onBack, step, maxReached, onStepClick, alreadyConfirmed }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void; alreadyConfirmed: boolean;
}) {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [intentError, setIntentError] = useState('');
  const [cardConfirmed, setCardConfirmed] = useState(alreadyConfirmed);
  const [confirming, setConfirming] = useState(false);
  const stripeReady = isStripeConfigured();

  useEffect(() => {
    let cancelled = false;
    apiBrowsePlatformPlans()
      .then(res => {
        if (cancelled) return;
        const list = res.data ?? [];
        setPlans(list);
        if (!form.platformPlanId && list.length > 0) {
          const cheapestPaid = [...list].filter(p => !p.isFree).sort((a, b) => (a.monthlyPriceUSD ?? 0) - (b.monthlyPriceUSD ?? 0))[0];
          setForm({ ...form, platformPlanId: (cheapestPaid ?? list[0])._id });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPlansLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (alreadyConfirmed || !stripeReady) return;
    let cancelled = false;
    apiCreateOnboardingSetupIntent()
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(() => { if (!cancelled) setIntentError('Could not load the card form right now — you can still skip and add a card later.'); });
    return () => { cancelled = true; };
  }, [alreadyConfirmed, stripeReady]);

  const selectedPlan = plans.find(p => p._id === form.platformPlanId) ?? null;
  const trialDays = selectedPlan?.trialDays ?? 3;
  const priceLabel = selectedPlan ? (selectedPlan.isFree ? 'Free' : selectedPlan.monthlyPriceUSD != null ? `$${selectedPlan.monthlyPriceUSD}/mo` : '—') : '—';

  const handleConfirmed = async (setupIntentId: string) => {
    setConfirming(true);
    try {
      await apiConfirmOnboardingPaymentMethod(setupIntentId);
      setCardConfirmed(true);
    } catch {
      setIntentError('We saved your card with Stripe, but could not confirm it on our side — you can continue and add it again later from Billing.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
      <div className={clsx(NARROW_CONTENT)}>
        <div className="flex items-start justify-between mb-9">
          <div>
            <h1 className="text-[28px] font-bold text-carbon mb-2">Add a payment method</h1>
            <p className="text-[14px] text-slate">Optional — your {trialDays}-day free trial starts either way.</p>
          </div>
          {!cardConfirmed && (
            <button type="button" onClick={onNext} className="text-[12.5px] font-semibold text-slate hover:text-carbon shrink-0 mt-1">
              Skip
            </button>
          )}
        </div>

        {!plansLoading && plans.length > 1 && !cardConfirmed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-5">
            {plans.filter(p => !p.isFree).map(p => {
              const sel = p._id === form.platformPlanId;
              return (
                <div key={p._id} onClick={() => setForm({ ...form, platformPlanId: p._id })}
                  className={clsx(
                    'rounded-xl px-3 py-[10px] border-2 cursor-pointer transition-all duration-150',
                    sel ? 'bg-brand-pale-orange/40 border-brand-orange' : 'bg-white border-bone hover:border-slate/40',
                  )}
                >
                  <p className="text-[12.5px] font-bold text-carbon">{p.name}</p>
                  <p className="text-[11px] text-slate">{p.monthlyPriceUSD != null ? `$${p.monthlyPriceUSD}/mo` : 'Custom'}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-cream rounded-xl px-[18px] py-[14px] mb-5">
          <div className="flex items-center justify-between text-[12.5px] mb-[6px]">
            <span className="text-slate">Today</span>
            <span className="font-semibold text-carbon">{trialDays} days free</span>
          </div>
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-slate">After trial</span>
            <span className="font-semibold text-carbon">{priceLabel} · cancel anytime</span>
          </div>
        </div>

        {cardConfirmed ? (
          <div className="flex items-center gap-2 rounded-lg bg-success-bg px-[14px] py-[12px] mb-6">
            <ShieldCheck size={16} className="text-success shrink-0" />
            <p className="text-[12.5px] text-success">Payment method added — you won't be charged during your trial.</p>
          </div>
        ) : stripeReady ? (
          clientSecret ? (
            <div className="mb-6">
              <StripeCardSetup clientSecret={clientSecret} onConfirmed={handleConfirmed} />
              {confirming && <p className="text-[11px] text-slate mt-2">Confirming…</p>}
            </div>
          ) : intentError ? (
            <div className="flex items-center gap-2 rounded-lg bg-error-bg px-[14px] py-[10px] mb-6 text-[12.5px] text-error">
              <AlertTriangle size={14} className="shrink-0" /> {intentError}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 mb-6">
              <Loader2 size={20} className="text-brand-orange animate-spin" />
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-cream px-[14px] py-[10px] mb-6 text-[12.5px] text-slate">
            <CreditCard size={14} className="shrink-0" /> Card setup isn't available in this environment — skip and add one later from Billing.
          </div>
        )}

        <div className="flex gap-[10px]">
          <Button variant="ghost" size="md" onClick={onBack} className="shrink-0">
            <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
          </Button>
          <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={onNext}>
            Continue <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Seller Type ──────────────────────────────────────────────────────
function Step3SellerType({ form, setForm, onNext, onBack, step, maxReached, onStepClick }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
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

// ── Step 4 — What You Sell ────────────────────────────────────────────────────
function Step4WhatYouSell({ form, setForm, onNext, onBack, step, maxReached, onStepClick }: {
  form: StoreForm; setForm: (f: StoreForm) => void;
  onNext: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  const toggle = (id: ProductType) =>
    setForm({ ...form, productTypes: form.productTypes.includes(id) ? form.productTypes.filter(x => x !== id) : [...form.productTypes, id] });

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
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

      <div className="flex gap-[10px]">
        <Button variant="ghost" size="md" onClick={onBack} className="shrink-0">
          <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
        </Button>
        <Button variant="primary" size="lg" className="flex-1 justify-center"
          onClick={() => form.productTypes.length > 0 && onNext()}
          disabled={form.productTypes.length === 0}>
          {form.productTypes.length > 0 ? <span>Continue <ArrowRight size={14} className="inline align-middle ml-1" /></span> : 'Select at least one'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 5 — Review & Submit ──────────────────────────────────────────────────
// Deliberately flat — plain labeled sections, no boxed/card sub-panels — so
// this step reads as a continuation of steps 1-5, not a different kind of
// screen bolted onto the end.
function Step5Review({ form, submitting, submitError, onSubmit, onBack, step, maxReached, onStepClick }: {
  form: StoreForm;
  submitting: boolean; submitError: string;
  onSubmit: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  const sellerLabel   = SELLER_TYPES.find(t => t.id === form.sellerType)?.title ?? form.sellerType ?? '—';
  const productLabels = form.productTypes.map(p => PRODUCT_TYPES.find(t => t.id === p)?.title ?? p).filter((v, i, a) => a.indexOf(v) === i).join(', ');

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
      <div className={clsx(NARROW_CONTENT, 'text-center mb-7')}>
        <h1 className="text-[28px] font-bold text-carbon mb-2">Review &amp; launch</h1>
        <p className="text-[14px] text-slate">Double-check everything, then launch your store.</p>
      </div>

      <div className={NARROW_CONTENT}>
        <div className="mb-6">
          <p className="text-[12px] font-bold text-carbon uppercase tracking-[0.05em] pb-2 mb-3 border-b border-bone">Store</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[10px]">
            <div><p className="text-[10px] text-slate">Store name</p><p className="text-[12.5px] font-semibold text-carbon">{form.storeName || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Seller type</p><p className="text-[12.5px] font-semibold text-carbon">{sellerLabel}</p></div>
            <div><p className="text-[10px] text-slate">Sells</p><p className="text-[12.5px] font-semibold text-carbon">{productLabels || '—'}</p></div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-left mb-6 bg-success-bg rounded-xl px-[14px] py-[12px]">
          <ShieldCheck size={16} className="text-success shrink-0 mt-[1px]" />
          <p className="text-[12.5px] text-success leading-[1.6]">Your store goes live immediately — no waiting on review, no card needed. Your free 3-day trial starts the moment you launch.</p>
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
            <Button variant="primary" size="lg" fullWidth onClick={onSubmit} loading={submitting}>
              Launch My Store
            </Button>
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}

// ── Terminal state — store created and live ───────────────────────────────────
// Same flat, no-card treatment as Step4Review.
function StoreReadyConfirmation({ store }: { store: StoreData | null }) {
  const navigate = useNavigate();
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={TOTAL_STEPS} maxReached={TOTAL_STEPS} onStepClick={() => {}} />
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
  const [step, setStep]             = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [created, setCreated]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<StoreForm>({
    storeName: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [], baseCurrency: DEFAULT_CURRENCY,
    platformPlanId: '',
  });
  // Resumability — a reload/lost connection/different device shouldn't send
  // the seller back to step 1 with everything they've typed gone. Loaded
  // once on mount from the backend (not localStorage, so it survives a
  // browser switch too).
  const [progressLoading, setProgressLoading] = useState(true);
  // Whether a card is already on file (from a prior visit to the Payment
  // step) — lets Step2Payment skip re-fetching a SetupIntent and just show
  // a confirmation instead of the card form again.
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetOnboardingProgress()
      .then(res => {
        if (cancelled) return;
        const { draft, hasPlatformPaymentMethod } = res.data;
        if (draft) {
          setStep(draft.step);
          setMaxReached(draft.maxReached);
          setForm(prev => ({ ...prev, ...(draft.form as Partial<StoreForm>) }));
          // Resumed onto a later step than the entry redirect assumed —
          // correct the URL's step query param to match (e.g. reload mid-wizard).
          navigate(`/onboard/${sessionId}?step=${STEP_SLUGS[draft.step - 1]}`, { replace: true });
        }
        setAlreadyConfirmed(!!hasPlatformPaymentMethod);
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
  const jumpTo = (target: number) => { setStep(target); goToUrlStep(target); };

  // The ONE place the store gets created — never earlier. Store creation and
  // the automatic trial are unconditional (see StoreService.createStore's
  // `selfServeActivation` and `ensureDefaultSubscription`) — whether the
  // Payment step resulted in a saved card or was skipped makes no difference
  // here; platformPlanId is passed through only as a preference for which
  // plan the trial is under, never as a gate.
  const handleFinalSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      let store = createStore.store;
      if (!store) {
        store = await createStore.execute({
          name:         form.storeName,
          description:  form.description,
          sellerType:   form.sellerType as SellerType,
          productTypes: [...new Set(form.productTypes)],
          baseCurrency: form.baseCurrency,
          ...(form.platformPlanId ? { platformPlanId: form.platformPlanId } : {}),
        });
        if (!store) { setSubmitError(createStore.error || 'Failed to create store. Please try again.'); return; }
      }
      setCreated(true);
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

  if (created) {
    return (
      <AuthSplitLayout
        panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
        heading="You're all set."
        subtext="Your store is live on Solvexo — start building your storefront right away."
        highlights={ONBOARDING_HIGHLIGHTS}
        visual={<SellerDashboardMockup />}
        bare
      >
        <div className="flex-1 flex items-start justify-center px-6 py-6">
          <StoreReadyConfirmation store={createStore.store} />
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      heading="Your store, your way."
      subtext="A few quick steps and your store goes live — no waiting on review."
      highlights={ONBOARDING_HIGHLIGHTS}
      visual={<SellerDashboardMockup />}
      bare
    >
      <div className="flex-1 flex items-start justify-center px-6 py-6">
        <StepPane step={step}>
          {step === 1 && <Step1StoreInfo form={form} setForm={setForm} onNext={next} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 2 && <Step2Payment form={form} setForm={setForm} onNext={next} onBack={back} step={step} maxReached={maxReached} onStepClick={jumpTo} alreadyConfirmed={alreadyConfirmed} />}
          {step === 3 && <Step3SellerType form={form} setForm={setForm} onNext={next} onBack={back} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 4 && <Step4WhatYouSell form={form} setForm={setForm} onNext={next} onBack={back} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 5 && (
            <Step5Review
              form={form}
              submitting={submitting} submitError={submitError}
              onSubmit={handleFinalSubmit} onBack={back}
              step={step} maxReached={maxReached} onStepClick={jumpTo}
            />
          )}
        </StepPane>
      </div>
    </AuthSplitLayout>
  );
}
