import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCreateStore } from '@/hooks/store/useCreateStore';
import { TokenStorage, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { Button } from '@/components/comman/ui/Button';
import {
  Camera, Palette, BookOpen, Store, Briefcase, Monitor, Globe,
  Package, Download, Calendar, Repeat, MonitorSmartphone,
  Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle, Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useUpload } from '@/hooks/upload/useUpload';
import { PasteImageUrl } from '@/components/comman/ui';
import { apiGetEnabledCurrencies, apiSuggestLocation, apiUpdateStore, type SellerType, type ProductType, type StoreData, type SupportedCurrency } from '@/api/services/store';
import { getStorefrontUrl } from '@/utils/storefrontUrl';
import {
  apiGetOnboardingProgress, apiSaveOnboardingDraft,
  apiGetPublicTrialSettings, apiBrowsePlatformPlans, apiChangePlatformPlan,
  type PlatformPlan,
} from '@/api/services/platformPlans';
import { OnboardingCheckoutPage, OnboardingPlansPage } from './OnboardingCheckout';
import { pickCheckoutPlan, type OnboardingBilling } from './onboardingPlans';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { AnimatePresence } from 'motion/react';

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

// Every step (and the "View all plans" sheet on top of the checkout) has its
// own readable URL, and the URL is the source of truth for where the wizard is:
//
//   /onboard?step=store-info
//   /onboard?step=checkout
//   /onboard?step=checkout&view=plans     ← "View all plans"
//   /onboard?step=seller-type
//   /onboard?step=what-you-sell
//
// The step lives in the QUERY string, not the URL path, deliberately —
// `RootLayout.tsx` keys its page-level `<ErrorBoundary>` by `pathname` (app-wide,
// so any route always remounts cleanly past a caught error). `pathname` doesn't
// include the query string, so keeping the path a constant `/onboard` means the
// wizard advances without ever remounting or re-fetching. (Putting the step in
// the path was tried and made every Back/Next remount the page and re-run the
// draft-resume fetch, visible as the page "reloading" repeatedly.)
//
// A reload therefore lands on exactly the step in the URL — the backend draft
// only restores the form's data and how far the seller has actually got (the
// URL can never run ahead of that), and is used as the landing step only for a
// bare `/onboard` with no `?step=`.
const STEP_SLUGS = ['store-info', 'checkout', 'seller-type', 'what-you-sell'];
/** `payment` was the old slug for the checkout step — keep old links working. */
const slugToStep = (slug: string | null): number | null => {
  if (slug === 'payment') return 2;
  const i = STEP_SLUGS.indexOf(slug ?? '');
  return i === -1 ? null : i + 1;
};
const onboardUrl = (n: number, view?: 'plans') => `/onboard?step=${STEP_SLUGS[n - 1]}${view ? `&view=${view}` : ''}`;

/** Old `/onboard/:sessionId?step=…` links (a random id in the path) → `/onboard?step=…`. */
export function OnboardingEntry() {
  const { search } = useLocation();
  return <Navigate to={`/onboard${search}`} replace />;
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
  // The store is created the moment the seller pays on the checkout step (the
  // plan is bought against a store), not at the last step — these two let a
  // reload/back-navigation resume without creating a second store or
  // charging twice. `paidPlanId` is set only after the charge succeeded.
  createdStoreId: string | null;
  paidPlanId: string | null;
  // Plan billing interval chosen on the plans page — persisted with the draft so a
  // reload keeps it. Optional because drafts saved before this existed lack it.
  billing?: OnboardingBilling;
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
  const { upload: uploadLogo, uploadUrl: uploadLogoUrl, uploading: logoUploading } = useUpload('public');
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

  const handleLogoUrlUploaded = (url: string) => {
    setPreview(url);
    setForm({ ...form, logo: url });
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
                ? <img loading="lazy" decoding="async" src={preview} alt="logo" className="max-w-full max-h-full object-contain" />
                : <Camera size={28} className="text-brand-orange" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} disabled={logoUploading} />
          </label>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-carbon mb-1">Store Logo</p>
            <p className="text-[12px] text-slate">PNG, JPG or WebP. Click to upload.</p>
            {logoUploading && <p className="text-[11px] text-brand-orange mt-1">Uploading…</p>}
            {!logoUploading && form.logo && <p className="text-[11px] text-success mt-1">✓ Logo uploaded</p>}
            <PasteImageUrl upload={uploadLogoUrl} onUploaded={handleLogoUrlUploaded} className="mt-1.5" />
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
          {selectedPlan && form.paidPlanId
            ? `Your store goes live immediately — no waiting on review. You're already on the ${selectedPlan.name} plan.`
            : selectedPlan
            ? `Your store goes live immediately — no waiting on review. You'll launch on the ${selectedPlan.name} plan.`
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

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  usePageTitle('Onboarding');
  const createStore = useCreateStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Furthest step the seller has actually reached (from the backend draft,
  // advanced as they go) — the URL is never allowed to run ahead of it.
  const [maxReached, setMaxReached] = useState(1);
  // The step the draft was last saved on — only the landing step for a bare
  // `/onboard` with no `?step=` (an explicit URL always wins).
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  // Bumped after every failed charge so a retry gets a fresh Stripe
  // idempotency key (a reused key would just replay the failed response).
  const chargeAttempt = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<StoreForm>({
    storeName: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [], baseCurrency: DEFAULT_CURRENCY,
    selectedPlanId: null, createdStoreId: null, paidPlanId: null,
  });
  // Monthly or annual, from the plans page's toggle (defaults to monthly).
  const billing: OnboardingBilling = form.billing ?? 'monthly';
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
          setResumeStep(Math.min(draft.step, TOTAL_STEPS));
          setMaxReached(Math.min(draft.maxReached, TOTAL_STEPS));
          setForm(prev => ({ ...prev, ...(draft.form as Partial<StoreForm>) }));
        }
      })
      // A failed resume-check isn't fatal — the wizard just starts fresh.
      .catch(() => {})
      .finally(() => { if (!cancelled) setProgressLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // The URL decides the step. It's clamped so it can never run ahead of the
  // furthest step actually reached, nor past step 1 before a store name exists
  // (a hand-typed `?step=seller-type` just lands on the right earlier step).
  const wantedStep = slugToStep(searchParams.get('step')) ?? resumeStep ?? 1;
  const storeNamed = form.storeName.trim().length > 0;
  const step = progressLoading ? 1 : Math.max(1, Math.min(wantedStep, maxReached, storeNamed ? TOTAL_STEPS : 1));
  // "View all plans" is a sheet over the checkout step, addressable by URL so a
  // reload keeps it open.
  const showPlansPage = step === 2 && searchParams.get('view') === 'plans';

  // Keep the address bar canonical: fills in a missing `?step=`, rewrites the
  // old `payment` slug, and pulls an out-of-range step back to where the seller
  // really is (replace, so it never stacks a history entry).
  useEffect(() => {
    if (progressLoading) return;
    const wantView = showPlansPage ? 'plans' : null;
    if (searchParams.get('step') !== STEP_SLUGS[step - 1] || searchParams.get('view') !== wantView) {
      navigate(onboardUrl(step, showPlansPage ? 'plans' : undefined), { replace: true });
    }
  }, [progressLoading, step, showPlansPage, searchParams, navigate]);

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
  // Moving between steps is just a navigation — the step is derived from the
  // URL above. Going forward pushes a history entry so the browser's own Back
  // button works; the wizard's Back button replaces so it never piles entries up.
  const goToStep = (n: number, replace = false) => navigate(onboardUrl(n), { replace });
  const next = () => {
    const n = Math.min(step + 1, TOTAL_STEPS);
    const newMax = Math.max(maxReached, n);
    setMaxReached(newMax);
    saveDraft(n, newMax);
    goToStep(n);
  };
  const back = () => goToStep(Math.max(step - 1, 1), true);
  // Like `next`, but for a transition that also changes the form in the same
  // tick — `next` would persist the stale `form` from this render's closure.
  const advanceWith = (nf: StoreForm, n: number) => {
    setForm(nf);
    const newMax = Math.max(maxReached, n);
    setMaxReached(newMax);
    apiSaveOnboardingDraft({ step: n, maxReached: newMax, form: nf as unknown as Record<string, unknown> }).catch(() => {});
    goToStep(n);
  };

  // Step 2 (Shopify-style checkout) — card submit CHARGES IMMEDIATELY. A plan is
  // bought against a store, so the store is created here (name/logo/currency
  // only — seller type and product types are filled in by the later steps via
  // apiUpdateStore) and then the ALREADY-EXISTING mid-trial "buy a plan now"
  // endpoint (PATCH :storeId/change-plan, billImmediately: true — the same
  // code path the Billing Center uses) charges the card just confirmed against
  // the seller's Stripe customer; the trial ends right there. The store id is
  // persisted to the draft BEFORE charging, so a declined card / reload never
  // creates a second store — the retry reuses it. Throws with a seller-facing
  // message on failure; the checkout page shows it inline.
  const handleSubscribe = async (planId: string) => {
    let storeId = form.createdStoreId;
    if (!storeId) {
      const store = await createStore.execute({
        name:         form.storeName,
        logo:         form.logo || undefined,
        description:  form.description,
        productTypes: [],
        baseCurrency: form.baseCurrency,
      });
      if (!store) throw new Error('We could not create your store. Please try again.');
      storeId = store._id;
      const withStore = { ...form, createdStoreId: storeId };
      setForm(withStore);
      apiSaveOnboardingDraft({ step: 2, maxReached: 2, form: withStore as unknown as Record<string, unknown> }).catch(() => {});
    }
    try {
      await apiChangePlatformPlan(storeId, planId, billing === 'annual' ? 'yearly' : 'monthly', true,
        `platform-plan-onboarding-${storeId}-${planId}-${chargeAttempt.current}`);
    } catch (err) {
      chargeAttempt.current += 1;
      throw new Error(err instanceof Error && err.message ? err.message : 'Your card was declined — please try again or use a different card.', { cause: err });
    }
    advanceWith({ ...form, createdStoreId: storeId, selectedPlanId: planId, paidPlanId: planId }, 3);
  };

  // Last step — finishes the store. A seller who paid on the checkout step
  // already has a store (`form.createdStoreId`): it just gets its seller type
  // and product types filled in. A seller who skipped to the free trial has no
  // store yet, so it's created here with everything at once (the automatic
  // per-store trial starts unconditionally — see StoreService.createStore and
  // `ensureDefaultSubscription`). Picking the free plan is applied right after
  // via the same change-plan call; a failure there never fails the launch.
  const handleFinalSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      let store: StoreData | null;
      if (form.createdStoreId) {
        const res = await apiUpdateStore({
          storeId:      form.createdStoreId,
          sellerType:   form.sellerType as SellerType,
          productTypes: [...new Set(form.productTypes)],
        });
        store = res.data?._id ? res.data : ({ ...res.data, _id: form.createdStoreId } as StoreData);
      } else {
        store = await createStore.execute({
          name:         form.storeName,
          logo:         form.logo || undefined,
          description:  form.description,
          sellerType:   form.sellerType as SellerType,
          productTypes: [...new Set(form.productTypes)],
          baseCurrency: form.baseCurrency,
        });
        if (!store) { setSubmitError(createStore.error || 'Failed to create store. Please try again.'); return; }
        const freePlan = plans.find(p => p._id === form.selectedPlanId && p.isFree);
        if (freePlan) {
          try {
            await apiChangePlatformPlan(store._id, freePlan._id, 'monthly', true, `platform-plan-onboarding-${store._id}`);
          } catch {
            // The store is live on its trial either way; plans can be changed from Billing.
          }
        }
      }
      // Onboarding is finished: reset the draft (so a later /onboard for another store
      // starts fresh instead of resuming this one) and go straight to the dashboard.
      await apiSaveOnboardingDraft({ step: 1, maxReached: 1, form: {} }).catch(() => {});
      navigate(`/store/${store._id}/dashboard`, { replace: true });
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
        bare
      >
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <Loader2 size={24} className="text-brand-orange animate-spin" />
        </div>
      </AuthSplitLayout>
    );
  }

  // Step 2 is a full-viewport Shopify-style checkout, outside the split layout.
  // "View all plans" slides up over it (and back down on close) — the checkout
  // stays mounted underneath so the card form and what's typed in it survive.
  if (step === 2) {
    const checkoutPlan = pickCheckoutPlan(plans, form.selectedPlanId);
    return (
      <>
        <OnboardingCheckoutPage
          plans={plans}
          selectedPlanId={form.selectedPlanId}
          billing={billing}
          paidPlanId={form.paidPlanId}
          trialDurationDays={trialDurationDays}
          onSubscribe={handleSubscribe}
          onContinue={() => advanceWith({ ...form, selectedPlanId: checkoutPlan?._id ?? null }, 3)}
          onStartTrial={() => advanceWith({ ...form, selectedPlanId: null }, 3)}
          onViewPlans={() => navigate(onboardUrl(2, 'plans'))}
          onBack={back}
        />
        <AnimatePresence>
          {showPlansPage && (
            <OnboardingPlansPage
              key="plans"
              plans={plans}
              selectedPlanId={form.selectedPlanId}
              billing={billing}
              onBillingChange={b => setForm(f => ({ ...f, billing: b }))}
              onClose={() => navigate(onboardUrl(2), { replace: true })}
              onSelect={planId => { setForm({ ...form, selectedPlanId: planId }); navigate(onboardUrl(2), { replace: true }); }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      pageContext="onboarding"
      heading="Your store, your way."
      subtext="A few quick steps and your store goes live — no waiting on review."
      highlights={ONBOARDING_HIGHLIGHTS}
      bare
    >
      <div className="flex-1 flex items-start justify-center px-6 py-6">
        <StepPane step={step}>
          {step === 1 && <Step1StoreInfo form={form} setForm={setForm} onNext={next} />}
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
