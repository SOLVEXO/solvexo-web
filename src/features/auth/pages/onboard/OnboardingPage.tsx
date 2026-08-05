import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCreateStore } from '@/hooks/store/useCreateStore';
import { useStandaloneRequirementsPreview } from '@/hooks/store/useStoreVerification';
import { TokenStorage, getRoleRedirect, type AppRole } from '@/api/services/auth';
import { Button } from '@/components/comman/ui/Button';
import {
  Camera, Palette, BookOpen, Store, Briefcase, Monitor, Globe,
  Package, Download, Calendar, Repeat, MonitorSmartphone,
  Sparkles, ArrowRight, ArrowLeft, Check, AlertTriangle, Loader2,
  ShieldCheck, Clock3,
} from 'lucide-react';
import { useUpload } from '@/hooks/upload/useUpload';
import type { SellerType, ProductType, StoreData, SupportedCurrency } from '@/api/services/store';
import {
  apiUpdateVerification, apiAttachVerificationDocument, apiSubmitVerification,
  type VerificationDocumentType, type VerificationDocumentView,
} from '@/api/services/storeVerification';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import { SellerDashboardMockup } from '@/features/auth/components/mockups/AuthMockups';
import {
  BusinessInfoFields, DocumentUploadCard, VERIFICATION_LEVEL_LABELS, previewVerificationLevel,
  type BusinessInfoValues,
} from '@/features/seller/components/verification/VerificationFormFields';

const ONBOARDING_HIGHLIGHTS = [
  { Icon: Store,     text: 'A store built around how you sell' },
  { Icon: Sparkles,  text: 'AI Studio and analytics from day one' },
  { Icon: ShieldCheck, text: 'Verified sellers buyers can trust' },
];

// One continuous seller-activation journey — store setup, seller profile,
// business information, documents, and review/submit are all steps of the
// SAME wizard. Nothing is created on the backend until the very last step:
// steps 1-5 only ever touch local component state (document files upload
// straight to Cloudinary to get a publicId, but aren't attached to
// anything yet) — the store record, the saved business info, and the
// attached documents are all created together in ONE batch when "Submit
// for Review" is clicked, so an abandoned/incomplete onboarding attempt
// never leaves a half-created store behind.
const STEPS = ['Store Info', 'Seller Type', 'What You Sell', 'Business Info', 'Documents', 'Review'];
const TOTAL_STEPS = STEPS.length;

// Every step shares this exact outer width so the progress header (badge +
// bar + circles) renders at the same size on every tab — only the narrower
// steps constrain their inner content below it.
const STEP_WIDTH = 'max-w-[760px]';
const NARROW_CONTENT = 'max-w-[480px] mx-auto';

const SELLER_TYPES: { id: SellerType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'creator',  Icon: Palette,   title: 'Creator',          desc: 'Sell digital art, templates, fonts, music, presets' },
  { id: 'creator',  Icon: BookOpen,  title: 'Educator',         desc: 'Worksheets, lesson plans, curriculum, assessments' },
  { id: 'retailer', Icon: Store,     title: 'Retailer',         desc: 'Physical goods, handmade products, branded items' },
  { id: 'brand',    Icon: Briefcase, title: 'Brand / Business', desc: 'Run a full online store with inventory and POS' },
  { id: 'reseller', Icon: Monitor,   title: 'Reseller',         desc: 'Source and resell products from suppliers' },
  { id: 'creator',  Icon: Globe,     title: 'Mix of the above', desc: 'I sell across multiple categories and formats' },
];

const PRODUCT_TYPES: { id: ProductType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'physical_products', Icon: Package,           title: 'Physical Products',     desc: 'Ship items to customers' },
  { id: 'digital_downloads', Icon: Download,          title: 'Digital Downloads',     desc: 'PDFs, files, audio, video' },
  { id: 'educational_resources', Icon: BookOpen,      title: 'Educational Resources', desc: 'Worksheets, lesson plans' },
  { id: 'services',          Icon: Calendar,          title: 'Services / Bookings',   desc: 'Appointments and packages' },
  { id: 'services',          Icon: Repeat,            title: 'Subscriptions',         desc: 'Recurring membership access' },
  { id: 'in_person_pos',     Icon: MonitorSmartphone, title: 'In-Person / POS',       desc: 'Sell at a physical location' },
];

interface StoreForm {
  storeName:    string;
  categoryId:   string;
  categoryName: string;
  description:  string;
  logo:         string;
  sellerType:   SellerType | '';
  sellerKey:    string;
  productTypes: ProductType[];
  /** Set automatically (no form field — see DEFAULT_CURRENCY), sent to the
   *  backend as part of store creation. Locked forever once the store has
   *  its first product (see CreateStorePayload.baseCurrency). */
  baseCurrency: SupportedCurrency;
}

// Solvexo is Pakistan-origin, so every store defaults to PKR pricing
// automatically — no picker shown during onboarding. A real IP/locale-based
// default can replace this constant later without touching anything else,
// since the rest of the app only ever reads `store.baseCurrency`.
const DEFAULT_CURRENCY: SupportedCurrency = 'PKR';

const EMPTY_BUSINESS_INFO: BusinessInfoValues = {
  country: 'PK',
  businessType: null,
  legalBusinessName: '',
  registrationNumber: '',
  taxId: '',
  businessAddress: '',
  idDocumentType: null,
  authorizedContact: { name: null, designation: null, email: null, phone: null },
};

/** A document the user has uploaded to Cloudinary (private storage) during
 *  onboarding but that isn't attached to a store yet — nothing to attach it
 *  TO until the store is created at final submit. */
interface PendingDocument { publicId: string; resourceType: string; fileName: string }

function isFieldFilled(values: BusinessInfoValues, path: string): boolean {
  if (path.startsWith('authorizedContact.')) {
    const key = path.split('.')[1] as keyof typeof values.authorizedContact;
    return !!values.authorizedContact[key]?.trim();
  }
  const value = (values as any)[path];
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

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
function Step1({ form, setForm, onNext, step, maxReached, onStepClick }: {
  form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  const [preview, setPreview] = useState('');
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const canProceed = form.storeName.trim().length > 0 && form.categoryId.length > 0;
  const { upload: uploadLogo, uploading: logoUploading } = useUpload('public');

  useEffect(() => {
    let cancelled = false;
    apiGetCategoryTree()
      .then(res => { if (!cancelled) setCategories(res.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCategoriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCategoryChange = (id: string) => {
    const name = categories.find(c => c._id === id)?.name ?? '';
    setForm({ ...form, categoryId: id, categoryName: name });
  };

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
              Your store URL will look like: <span className="text-brand-orange">solvexo.store/{form.storeName.toLowerCase().replace(/\s+/g, '-')}</span>
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="onboard-category" className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Category <span className="text-brand-orange">*</span></label>
          <select id="onboard-category" value={form.categoryId} onChange={e => handleCategoryChange(e.target.value)}
            disabled={categoriesLoading}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white cursor-pointer disabled:opacity-60 transition-[border-color,box-shadow] duration-150 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10">
            <option value="">{categoriesLoading ? 'Loading categories...' : 'Select your main category...'}</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
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
function Step2({ form, setForm, onNext, onBack, step, maxReached, onStepClick }: {
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

// ── Step 3 — What You Sell ────────────────────────────────────────────────────
function Step3({ form, setForm, onNext, onBack, step, maxReached, onStepClick }: {
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
              {form.productTypes.includes('services')          && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Bookings</span>}
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

// ── Step 4 — Business Information ────────────────────────────────────────────
function Step4BusinessInfo({ values, onChange, missingFields, requirementsReady, onNext, onBack, step, maxReached, onStepClick }: {
  values: BusinessInfoValues; onChange: (v: BusinessInfoValues) => void;
  missingFields: string[]; requirementsReady: boolean; onNext: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  // `requirementsReady` guards a real race: the live requirements preview
  // loads asynchronously, and before its first response arrives
  // `missingFields` would otherwise default to an empty array (nothing
  // *known* to be missing yet) — which let a fast click-through past this
  // step skip mandatory fields entirely, only surfacing at Review.
  const canProceed = values.businessType !== null && requirementsReady && missingFields.length === 0;
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
      <div className={clsx(NARROW_CONTENT, 'text-center mb-7')}>
        <h1 className="text-[28px] font-bold text-carbon mb-2">Tell us about your business</h1>
        <p className="text-[14px] text-slate">This establishes who's legally responsible for the store — required before it can go live on the marketplace.</p>
      </div>
      <div className={NARROW_CONTENT}>
        <BusinessInfoFields values={values} onChange={onChange} />
        {!requirementsReady && values.businessType && (
          <p className="text-[11.5px] text-slate mt-2 mb-1">Checking requirements for your country/business type…</p>
        )}
        {requirementsReady && values.businessType && missingFields.length > 0 && (
          <p className="text-[11.5px] text-slate mt-2 mb-1">{missingFields.length} required field(s) still need to be filled in above.</p>
        )}
        <div className="flex gap-[10px] mt-2">
          <Button variant="ghost" size="md" onClick={onBack} className="shrink-0">
            <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
          </Button>
          <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={() => canProceed && onNext()} disabled={!canProceed}>
            Continue <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 5 — Documents ────────────────────────────────────────────────────────
function Step5Documents({ checklist, uploadingType, onUpload, onNext, onBack, completeCount, requiredCount, step, maxReached, onStepClick }: {
  checklist: VerificationDocumentView[]; uploadingType: VerificationDocumentType | null;
  onUpload: (type: VerificationDocumentType, file: File) => void;
  onNext: () => void; onBack: () => void; completeCount: number; requiredCount: number;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
      <div className={clsx(NARROW_CONTENT, 'text-center mb-7')}>
        <h1 className="text-[28px] font-bold text-carbon mb-2">Upload your verification documents</h1>
        <p className="text-[14px] text-slate">Based on your country and business type — you can still review everything before submitting.</p>
      </div>
      <div className={NARROW_CONTENT}>
        {requiredCount > 0 && (
          <p className="text-[11.5px] font-semibold text-slate mb-3 text-right">{completeCount} of {requiredCount} required documents complete</p>
        )}
        <div className="flex flex-col gap-3 mb-6">
          {checklist.map(doc => (
            <DocumentUploadCard
              key={doc.type}
              doc={doc}
              uploading={uploadingType === doc.type}
              onUpload={file => onUpload(doc.type, file)}
            />
          ))}
        </div>
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

// ── Step 6 — Review & Submit ──────────────────────────────────────────────────
// Deliberately flat — plain labeled sections, no boxed/card sub-panels — so
// this step reads as a continuation of steps 1-5, not a different kind of
// screen bolted onto the end.
function Step6Review({ form, businessInfo, level, checklist, missingFields, missingDocs, canSubmit, submitting, submitError, onSubmit, onBack, step, maxReached, onStepClick }: {
  form: StoreForm; businessInfo: BusinessInfoValues; level: 'basic' | 'business' | 'enhanced';
  checklist: VerificationDocumentView[]; missingFields: string[]; missingDocs: VerificationDocumentView[];
  canSubmit: boolean; submitting: boolean; submitError: string;
  onSubmit: () => void; onBack: () => void;
  step: number; maxReached: number; onStepClick: (step: number) => void;
}) {
  const sellerLabel   = SELLER_TYPES.find(t => t.id === form.sellerType)?.title ?? form.sellerType ?? '—';
  const productLabels = form.productTypes.map(p => PRODUCT_TYPES.find(t => t.id === p)?.title ?? p).filter((v, i, a) => a.indexOf(v) === i).join(', ');

  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={step} maxReached={maxReached} onStepClick={onStepClick} />
      <div className={clsx(NARROW_CONTENT, 'text-center mb-7')}>
        <h1 className="text-[28px] font-bold text-carbon mb-2">Review &amp; submit</h1>
        <p className="text-[14px] text-slate">Double-check everything, then submit for verification review.</p>
      </div>

      <div className={NARROW_CONTENT}>
        <div className="mb-6">
          <p className="text-[12px] font-bold text-carbon uppercase tracking-[0.05em] pb-2 mb-3 border-b border-bone">Store</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[10px]">
            <div><p className="text-[10px] text-slate">Store name</p><p className="text-[12.5px] font-semibold text-carbon">{form.storeName || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Category</p><p className="text-[12.5px] font-semibold text-carbon">{form.categoryName || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Seller type</p><p className="text-[12.5px] font-semibold text-carbon">{sellerLabel}</p></div>
            <div><p className="text-[10px] text-slate">Sells</p><p className="text-[12.5px] font-semibold text-carbon">{productLabels || '—'}</p></div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-bone">
            <p className="text-[12px] font-bold text-carbon uppercase tracking-[0.05em]">Business Information</p>
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-brand-deep-orange bg-brand-pale-orange rounded-full px-[9px] py-[3px]">
              {VERIFICATION_LEVEL_LABELS[level].label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[10px]">
            <div><p className="text-[10px] text-slate">Country</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.country}</p></div>
            <div><p className="text-[10px] text-slate">Business type</p><p className="text-[12.5px] font-semibold text-carbon capitalize">{businessInfo.businessType ?? '—'}</p></div>
            <div><p className="text-[10px] text-slate">Legal name</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.legalBusinessName || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Authorized contact</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.authorizedContact.name || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Business address</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.businessAddress || '—'}</p></div>
            <div><p className="text-[10px] text-slate">ID document type</p><p className="text-[12.5px] font-semibold text-carbon uppercase">{businessInfo.idDocumentType || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Contact email</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.authorizedContact.email || '—'}</p></div>
            <div><p className="text-[10px] text-slate">Contact phone</p><p className="text-[12.5px] font-semibold text-carbon">{businessInfo.authorizedContact.phone || '—'}</p></div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[12px] font-bold text-carbon uppercase tracking-[0.05em] pb-2 mb-3 border-b border-bone">Documents</p>
          <div className="flex flex-col gap-2">
            {checklist.map(doc => (
              <div key={doc.type} className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-charcoal capitalize">{doc.type.replace(/_/g, ' ')}</span>
                {doc.state === 'uploaded'
                  ? <span className="text-[11px] font-semibold text-success inline-flex items-center gap-1"><Check size={12} /> Uploaded</span>
                  : doc.required
                    ? <span className="text-[11px] font-semibold text-error">Missing</span>
                    : <span className="text-[11px] text-slate">Not required</span>}
              </div>
            ))}
          </div>
        </div>

        {(missingFields.length > 0 || missingDocs.length > 0) && (
          <div className="flex items-start gap-2 text-left mb-4">
            <AlertTriangle size={14} className="text-[#946200] shrink-0 mt-[2px]" />
            <p className="text-[12.5px] text-[#946200] leading-[1.6]">
              {missingFields.length > 0 && `${missingFields.length} business field(s) still missing. `}
              {missingDocs.length > 0 && `${missingDocs.length} required document(s) still missing.`}
              {' '}Go back to fix these before submitting.
            </p>
          </div>
        )}

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
          <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={onSubmit} disabled={!canSubmit} loading={submitting}>
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Terminal state — application submitted ───────────────────────────────────
// Same flat, no-card treatment as Step6Review.
const REVIEW_STAGES = [
  { Icon: Briefcase,   label: 'Application Submitted', desc: 'Business info & documents received' },
  { Icon: Clock3,      label: 'Admin Review',          desc: 'Usually within 1–2 business days' },
  { Icon: ShieldCheck, label: 'Store Goes Live',        desc: 'Full seller access unlocks automatically' },
];

function SubmittedConfirmation({ store }: { store: StoreData | null }) {
  const navigate = useNavigate();
  return (
    <div className={clsx(STEP_WIDTH, 'w-full mx-auto')}>
      <OnboardingStepHeader step={TOTAL_STEPS} maxReached={TOTAL_STEPS} onStepClick={() => {}} />
      <div className={clsx(NARROW_CONTENT, 'text-center')}>
        <div className="size-14 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
          <Check size={26} className="text-success" />
        </div>
        <h1 className="text-[28px] font-bold text-carbon mb-[10px]">Application submitted</h1>
        <p className="text-[14px] text-slate leading-[1.7] mb-7 max-w-[420px] mx-auto">
          {store?.name || 'Your store'} and your business verification are both in — our team will review it and you'll be notified as soon as a decision is made.
        </p>
        <div className="flex flex-col gap-4 mb-7 text-left">
          {REVIEW_STAGES.map(({ Icon, label, desc }, i) => (
            <div key={label} className="flex items-start gap-3">
              <div className="size-7 rounded-full bg-brand-pale-orange flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-orange">{i + 1}</div>
              <div>
                <p className="text-[12.5px] font-bold text-carbon inline-flex items-center gap-[6px]"><Icon size={14} className="text-brand-orange" /> {label}</p>
                <p className="text-[11.5px] text-slate mt-[2px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/seller/store/${store?._id}/dashboard`, { replace: true })}>
          Go to My Seller Workspace <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  usePageTitle('Onboarding');
  const createStore = useCreateStore();
  const [step, setStep]             = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<StoreForm>({
    storeName: '', categoryId: '', categoryName: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [], baseCurrency: DEFAULT_CURRENCY,
  });
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoValues>(EMPTY_BUSINESS_INFO);
  // Uploaded to Cloudinary already (so a slow scan/photo doesn't need
  // re-uploading if the seller navigates back and forth), but not attached
  // to any store yet — nothing to attach it to until final submit creates one.
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<VerificationDocumentType, PendingDocument>>>({});
  const [uploadingType, setUploadingType] = useState<VerificationDocumentType | null>(null);
  const [uploadError, setUploadError] = useState('');

  const { requirements, preview } = useStandaloneRequirementsPreview();
  const { upload: uploadDocument } = useUpload('private');

  // Recalculate requirements the instant country/business type changes —
  // same live-preview pattern as the returning-seller StoreVerification.tsx
  // page, never a client-side guess trusted for gating. Fires once on
  // mount too (default country 'PK', no business type yet).
  useEffect(() => {
    preview({ country: businessInfo.country, businessType: businessInfo.businessType ?? undefined });
  }, [businessInfo.country, businessInfo.businessType, preview]);

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

  const next   = () => setStep(s => { const n = Math.min(s + 1, TOTAL_STEPS); setMaxReached(m => Math.max(m, n)); return n; });
  const back   = () => setStep(s => Math.max(s - 1, 1));
  const jumpTo = (target: number) => setStep(target);

  const handleUploadDocument = useCallback(async (type: VerificationDocumentType, file: File) => {
    setUploadError('');
    setUploadingType(type);
    try {
      const uploaded = await uploadDocument(file, 'kyc_document');
      setPendingDocs(prev => ({ ...prev, [type]: { publicId: uploaded.publicId, resourceType: uploaded.resourceType, fileName: file.name } }));
    } catch {
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploadingType(null);
    }
  }, [uploadDocument]);

  // The ONE place anything gets created — store, business info, and
  // documents are all created/saved together here, never earlier. Uses the
  // freshly-created store's id directly from `createStore.execute`'s return
  // value (rather than waiting for a re-render) so a partial-failure retry
  // never creates a second store — `createStore.store` from a prior attempt
  // is reused instead of calling `execute` again.
  const handleFinalSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      let store = createStore.store;
      if (!store) {
        store = await createStore.execute({
          name:         form.storeName,
          categoryId:   form.categoryId,
          description:  form.description,
          sellerType:   form.sellerType as SellerType,
          productTypes: [...new Set(form.productTypes)],
          baseCurrency: form.baseCurrency,
        });
        if (!store) { setSubmitError(createStore.error || 'Failed to create store. Please try again.'); return; }
      }

      await apiUpdateVerification(store._id, {
        country: businessInfo.country,
        businessType: businessInfo.businessType ?? undefined,
        legalBusinessName: businessInfo.legalBusinessName,
        registrationNumber: businessInfo.registrationNumber,
        taxId: businessInfo.taxId,
        businessAddress: businessInfo.businessAddress,
        idDocumentType: businessInfo.idDocumentType ?? undefined,
        authorizedContact: businessInfo.authorizedContact,
      });

      for (const [type, doc] of Object.entries(pendingDocs)) {
        if (!doc) continue;
        await apiAttachVerificationDocument(store._id, type as VerificationDocumentType, doc);
      }

      await apiSubmitVerification(store._id);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit for review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Same "merge live requirements with what's actually uploaded" pattern as
  // the returning-seller StoreVerification.tsx page — except "what's
  // uploaded" comes from local `pendingDocs` state here, since nothing is
  // persisted to a store yet.
  const requiredDocs = requirements?.requiredDocuments ?? [];
  const optionalDocs = requirements?.optionalDocuments ?? [];
  const checklist: VerificationDocumentView[] = [...new Set([...requiredDocs, ...optionalDocs])].map((type) => {
    const uploaded = pendingDocs[type];
    const required = requiredDocs.includes(type);
    return {
      type,
      required,
      state: uploaded ? 'uploaded' : (required ? 'missing' : 'not_required'),
      fileName: uploaded?.fileName ?? null,
      uploadedAt: null,
      // No signed URL until the document is actually attached to a store
      // (at final submit) — DocumentUploadCard already handles a null
      // viewUrl by simply not rendering the "View" link.
      viewUrl: null,
    };
  });
  const missingFields = (requirements?.requiredFields ?? []).filter(path => !isFieldFilled(businessInfo, path));
  const missingDocs = checklist.filter(d => d.required && d.state !== 'uploaded');
  const requiredCount = checklist.filter(d => d.required).length;
  const completeCount = checklist.filter(d => d.required && d.state === 'uploaded').length;
  const canSubmit = missingFields.length === 0 && missingDocs.length === 0;
  const level = requirements?.verificationLevel ?? previewVerificationLevel(businessInfo.businessType);

  if (submitted) {
    return (
      <AuthSplitLayout
        panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
        heading="You're almost there."
        subtext="Our team reviews every new seller's business verification before their store goes live."
        highlights={ONBOARDING_HIGHLIGHTS}
        visual={<SellerDashboardMockup />}
        bare
      >
        <div className="flex-1 flex items-start justify-center px-6 py-6">
          <SubmittedConfirmation store={createStore.store} />
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      panelGradient="from-carbon via-[#241f1b] to-brand-deep-orange"
      heading="Your store, your way."
      subtext="A few quick steps and your Solvexo seller application is submitted — store, business info, documents, all in one place."
      highlights={ONBOARDING_HIGHLIGHTS}
      visual={<SellerDashboardMockup />}
      bare
    >
      <div className="flex-1 flex items-start justify-center px-6 py-6">
        <StepPane step={step}>
          {step === 1 && <Step1 form={form} setForm={setForm} onNext={next} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 2 && <Step2 form={form} setForm={setForm} onNext={next} onBack={back} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 3 && <Step3 form={form} setForm={setForm} onNext={next} onBack={back} step={step} maxReached={maxReached} onStepClick={jumpTo} />}
          {step === 4 && (
            <Step4BusinessInfo
              values={businessInfo} onChange={setBusinessInfo}
              missingFields={missingFields} requirementsReady={requirements !== null} onNext={next} onBack={back}
              step={step} maxReached={maxReached} onStepClick={jumpTo}
            />
          )}
          {step === 5 && (
            <>
              <Step5Documents
                checklist={checklist} uploadingType={uploadingType} onUpload={handleUploadDocument}
                onNext={next} onBack={back} completeCount={completeCount} requiredCount={requiredCount}
                step={step} maxReached={maxReached} onStepClick={jumpTo}
              />
              {uploadError && (
                <p className={clsx(NARROW_CONTENT, 'text-[12px] text-error mt-3')}>{uploadError}</p>
              )}
            </>
          )}
          {step === 6 && (
            <Step6Review
              form={form} businessInfo={businessInfo} level={level}
              checklist={checklist} missingFields={missingFields} missingDocs={missingDocs}
              canSubmit={canSubmit} submitting={submitting} submitError={submitError}
              onSubmit={handleFinalSubmit} onBack={back}
              step={step} maxReached={maxReached} onStepClick={jumpTo}
            />
          )}
        </StepPane>
      </div>
    </AuthSplitLayout>
  );
}
