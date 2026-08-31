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
  apiCreateOnboardingSetupIntent, apiConfirmOnboardingPaymentMethod,
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

// One short seller-activation journey, Shopify-style — collect only what's
// needed to spin up a real store (name, seller type, what you sell), then
// create it immediately on the last step. No separate mandatory Payment or
// Review step gates account creation any more (that used to be a 5-step
// wizard — Store Info, Payment, Seller Type, What You Sell, Review — with
// the store only created at the very end of all five). There is no
// admin-review queue either — the store self-serve-activates immediately on
// submit (see StoreService.createStore's `selfServeActivation`) and
// automatically starts a 3-day trial (see `ensureDefaultSubscription`)
// regardless of whether a payment method was ever added.
//
// Payment is real but entirely optional and now lives AFTER the store
// exists instead of gating its creation, matching Shopify's own real signup
// flow (confirmed against a live Shopify signup session, not just docs —
// Shopify shows a skippable billing/card screen right after signup, and
// skipping never blocks the trial or account creation). Concretely, once
// this 3-step wizard finishes, `PostCreatePaymentStep` (below) shows
// automatically — same placement as Shopify's — with the seller's own
// Solvexo subscription card (Stripe Elements SetupIntent). Deliberately
// scoped to ONLY that: connecting Stripe so the storefront can accept real
// customer payments (Stripe Connect) is the seller's own setup to do from
// Store Settings whenever they're ready, not something pushed during
// signup — it's still surfaced there and as a Setup Guide task, just not on
// this screen. Skipping this screen is never a dead end either way — the
// Solvexo-billing card task also lives permanently afterwards in the
// dashboard's persistent "Setup Guide" checklist (`SetupGuideCard.tsx`).
const STEPS = ['Store Info', 'Seller Type', 'What You Sell'];
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
const STEP_SLUGS = ['store-info', 'seller-type', 'what-you-sell'];

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
  // No `platformPlanId` field any more — plan selection isn't collected
  // during onboarding at all now (see the STEPS comment above); the backend
  // falls back to the cheapest real plan for the trial automatically
  // (CreateStorePayload.platformPlanId is optional), and a seller can change
  // plans any time afterwards from the store's own Billing page.
}

// Solvexo is Pakistan-origin, so every store defaults to PKR pricing
// automatically — no picker shown during onboarding. A real IP/locale-based
// default can replace this constant later without touching anything else,
// since the rest of the app only ever reads `store.baseCurrency`.
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

        <Button variant="primary" size="lg" fullWidth onClick={() => canProceed && onNext()} disabled={!canProceed}>
          Continue <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2 — Seller Type ──────────────────────────────────────────────────────
function Step2SellerType({ form, setForm, onNext, onBack }: {
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

// ── Step 3 — What You Sell (final step — launches the store directly) ────────
// Used to be a "Continue" step that fed into a separate Step5Review screen;
// now that store creation happens right after this step, it owns the submit
// action itself (matching the approved plan to drop Review as a separate
// mandatory gate) — same flat, no-boxed-sub-panel treatment the old Review
// step used for its launch confirmation and error messaging.
function Step3WhatYouSell({ form, setForm, onBack, submitting, submitError, onSubmit }: {
  form: StoreForm; setForm: (f: StoreForm) => void;
  onBack: () => void;
  submitting: boolean; submitError: string; onSubmit: () => void;
}) {
  const toggle = (id: ProductType) =>
    setForm({ ...form, productTypes: form.productTypes.includes(id) ? form.productTypes.filter(x => x !== id) : [...form.productTypes, id] });

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

// ── Post-creation Payment step — shown ONCE, automatically, right after the
// store is created and before landing on the dashboard, matching Shopify's
// own placement of its billing screen (a skippable next screen right after
// signup, not something the seller has to go find). Skipping — or completing
// it — never blocks anything: the trial already started the moment the store
// was created (see handleFinalSubmit), and it also lives permanently
// afterwards in the dashboard's Setup Guide checklist (SetupGuideCard.tsx),
// so this screen is never a one-shot lost opportunity.
//
// Only ONE payment concern belongs here: the seller's own Solvexo
// subscription card — real Stripe Elements (SetupIntent, no charge). This is
// Solvexo BEING PAID BY the store, never the store's own buyer-facing
// checkout. Accepting real customer payments (Stripe Connect) is deliberately
// NOT shown here — that's the seller's own setup to do from Store Settings
// whenever they're ready (it's still surfaced there, and as a task in the
// dashboard's Setup Guide checklist), not something to push during signup.
//
// Test vs. live is controlled entirely by which Stripe keys are configured
// (VITE_STRIPE_PUBLISHABLE_KEY here, STRIPE_SECRET_KEY on the backend —
// see PaymentGatewayService) — sk_test_.../pk_test_... today, sk_live_.../
// pk_live_... once Stripe goes live, with zero code changes either side.
function PostCreatePaymentStep({ onDone }: { onDone: () => void }) {
  const [clientSecret, setClientSecret] = useState('');
  const [intentError, setIntentError] = useState('');
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const stripeReady = isStripeConfigured();

  useEffect(() => {
    if (!stripeReady) return;
    let cancelled = false;
    apiCreateOnboardingSetupIntent()
      .then(res => { if (!cancelled) setClientSecret(res.data.clientSecret); })
      .catch(() => { if (!cancelled) setIntentError('Could not load the card form right now — you can add a card later from Billing.'); });
    return () => { cancelled = true; };
  }, [stripeReady]);

  const handleConfirmed = async (setupIntentId: string) => {
    setConfirming(true);
    try {
      await apiConfirmOnboardingPaymentMethod(setupIntentId);
      setCardConfirmed(true);
    } catch {
      setIntentError('We saved your card with Stripe, but could not confirm it on our side — you can add it again later from Billing.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <div className={clsx(NARROW_CONTENT)}>
        <div className="flex items-start justify-between mb-9">
          <div>
            <h1 className="text-[28px] font-bold text-carbon mb-2">Add a payment method</h1>
            <p className="text-[14px] text-slate">Optional — your store is already live and your free trial has started.</p>
          </div>
          <button type="button" onClick={onDone} className="text-[12.5px] font-semibold text-slate hover:text-carbon shrink-0 mt-1">
            Skip
          </button>
        </div>

        <div className="rounded-xl border border-bone px-[18px] py-[16px] mb-6">
          <p className="text-[13px] font-bold text-carbon mb-1">Add a card for your Solvexo subscription</p>
          <p className="text-[12px] text-slate mb-3">You won't be charged during your free trial.</p>

          {cardConfirmed ? (
            <div className="flex items-center gap-2 rounded-lg bg-success-bg px-[14px] py-[12px]">
              <ShieldCheck size={16} className="text-success shrink-0" />
              <p className="text-[12.5px] text-success">Payment method added.</p>
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
              <CreditCard size={14} className="shrink-0" /> Card setup isn't available in this environment — add one later from Billing.
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onDone}>
          Continue to My Dashboard <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Terminal state — store created and live ───────────────────────────────────
// Same flat, no-card treatment as the old Review step used to have.
function StoreReadyConfirmation({ store }: { store: StoreData | null }) {
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
  // 'wizard' → the 3-step form; 'payment' → the one-time post-creation
  // payment screen (PostCreatePaymentStep, shown automatically once the
  // store exists, matching Shopify's own placement of its billing screen);
  // 'ready' → the final "Your store is live" confirmation.
  const [phase, setPhase] = useState<'wizard' | 'payment' | 'ready'>('wizard');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<StoreForm>({
    storeName: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [], baseCurrency: DEFAULT_CURRENCY,
  });
  // Resumability — a reload/lost connection/different device shouldn't send
  // the seller back to step 1 with everything they've typed gone. Loaded
  // once on mount from the backend (not localStorage, so it survives a
  // browser switch too).
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetOnboardingProgress()
      .then(res => {
        if (cancelled) return;
        const { draft } = res.data;
        if (draft) {
          // Clamp against a draft saved under the OLD 5-step wizard (Store
          // Info, Payment, Seller Type, What You Sell, Review) — a seller who
          // reloads mid-onboarding after this change deploys could otherwise
          // resume onto a step index (4 or 5) that no longer exists and hit
          // `STEP_SLUGS[draft.step - 1]` as `undefined` in the URL.
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

  // The ONE place the store gets created — right after step 3, the last step
  // now that Payment and Review are gone. Store creation and the automatic
  // trial are unconditional (see StoreService.createStore's
  // `selfServeActivation` and `ensureDefaultSubscription`) — no
  // `platformPlanId` is sent from here at all any more, so the backend
  // always falls back to the cheapest real plan for the trial; a seller
  // picks a specific plan later from the store's own Billing page.
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
        });
        if (!store) { setSubmitError(createStore.error || 'Failed to create store. Please try again.'); return; }
      }
      setPhase('payment');
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

  if (phase === 'payment') {
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
          <PostCreatePaymentStep onDone={() => setPhase('ready')} />
        </div>
      </AuthSplitLayout>
    );
  }

  if (phase === 'ready') {
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
          {step === 1 && <Step1StoreInfo form={form} setForm={setForm} onNext={next} />}
          {step === 2 && <Step2SellerType form={form} setForm={setForm} onNext={next} onBack={back} />}
          {step === 3 && (
            <Step3WhatYouSell
              form={form} setForm={setForm} onBack={back}
              submitting={submitting} submitError={submitError} onSubmit={handleFinalSubmit}
            />
          )}
        </StepPane>
      </div>
    </AuthSplitLayout>
  );
}
