import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCreateStore } from '@/hooks/store/useCreateStore';
import { Button } from '@/components/ui/Button';
import { SolvexoLogo } from '@/components/ui/SolvexoLogo';
import {
  Camera, Palette, BookOpen, Store, Briefcase, Monitor, Globe,
  Package, Download, Calendar, Repeat, MonitorSmartphone,
  Sparkles, User, CreditCard, Plus, Wrench, ShoppingCart,
  ArrowRight, ArrowLeft, Check, AlertTriangle, Loader,
} from 'lucide-react';
import type { SellerType, ProductType, StoreData } from '@/api/commerce/store';

const STEPS = ['Store Info', 'Seller Type', 'What You Sell', 'Go Live'];

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
  { id: 'digital_downloads', Icon: BookOpen,          title: 'Educational Resources', desc: 'Worksheets, lesson plans' },
  { id: 'services',          Icon: Calendar,          title: 'Services / Bookings',   desc: 'Appointments and packages' },
  { id: 'services',          Icon: Repeat,            title: 'Subscriptions',         desc: 'Recurring membership access' },
  { id: 'in_person_pos',     Icon: MonitorSmartphone, title: 'In-Person / POS',       desc: 'Sell at a physical location' },
];

const CATEGORIES = [
  'Education & Learning', 'Art & Design', 'Handmade & Crafts',
  'Digital Downloads', 'Home & Lifestyle', 'Business & Productivity',
  'Fashion & Apparel', 'Technology', 'Arts & Crafts',
];

interface StoreForm {
  storeName:    string;
  categoryId:   string;
  description:  string;
  logo:         string;
  sellerType:   SellerType | '';
  sellerKey:    string;
  productTypes: ProductType[];
}

// ── Step Progress ─────────────────────────────────────────────────────────────
function StepProgress({ current, maxReached, onStepClick }: { current: number; maxReached: number; onStepClick: (step: number) => void }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n <= maxReached && n !== current;
        const active = n === current;
        const clickable = n <= maxReached && n !== current;
        return (
          <div key={n} className="flex items-center">
            <div
              className={clsx('flex flex-col items-center', clickable ? 'cursor-pointer' : 'cursor-default')}
              onClick={() => clickable && onStepClick(n)}
            >
              <div className={clsx(
                'size-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300',
                done    ? 'bg-success text-white'      : '',
                active  ? 'bg-brand-orange text-white shadow-[0_0_0_4px_#FBECE4]' : '',
                !done && !active ? 'bg-bone text-slate' : '',
              )}>
                {done ? <Check size={12} /> : n}
              </div>
              <span className={clsx(
                'mt-[6px] text-[10px] font-medium whitespace-nowrap',
                active ? 'text-brand-orange' : done ? 'text-success' : 'text-slate',
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx(
                'w-[60px] h-0.5 mb-4 mx-1 rounded-sm transition-all duration-300',
                n < maxReached ? 'bg-success' : 'bg-bone',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PageHeader({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex items-center justify-between px-10 h-16 border-b border-bone bg-white sticky top-11 z-10">
      <SolvexoLogo size={30} />
      <div className="flex items-center gap-[10px]">
        <span className="text-[13px] text-slate">Already have an account?</span>
        <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
      </div>
    </div>
  );
}

// ── Step 1 — Store Info ───────────────────────────────────────────────────────
function Step1({ form, setForm, onNext }: { form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void }) {
  const [preview, setPreview] = useState('');
  const canProceed = form.storeName.trim().length > 0 && form.categoryId.length > 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setForm({ ...form, logo: url });
  };

  return (
    <div className="max-w-[520px] w-full mx-auto">
      <div className="text-center mb-9">
        <h1 className="text-[28px] font-bold text-carbon mb-2">Set up your store</h1>
        <p className="text-[14px] text-slate">You can always update these details later from Settings.</p>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-bone w-full">
        <div className="flex gap-5 items-center p-4 bg-cream rounded-xl mb-6">
          <label className="size-[72px] rounded-2xl bg-brand-pale-orange border-2 border-dashed border-brand-orange flex items-center justify-center shrink-0 cursor-pointer overflow-hidden">
            {preview
              ? <img src={preview} alt="logo" className="w-full h-full object-cover" />
              : <Camera size={28} className="text-brand-orange" />}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
          </label>
          <div>
            <p className="text-[13px] font-semibold text-carbon mb-1">Store Logo</p>
            <p className="text-[12px] text-slate">PNG, JPG or WebP. Click to upload.</p>
            {preview && <p className="text-[11px] text-success mt-1">✓ Logo selected</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Name <span className="text-brand-orange">*</span></label>
          <input placeholder="e.g. Creative Classroom Resources"
            value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white" />
          {form.storeName && (
            <p className="text-[11px] text-slate mt-[5px]">
              Your store URL: <span className="text-brand-orange">{form.storeName.toLowerCase().replace(/\s+/g, '-')}.solvexo.store</span>
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Category <span className="text-brand-orange">*</span></label>
          <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white cursor-pointer">
            <option value="">Select your main category...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-[12px] font-medium text-charcoal mb-[6px]">Store Description <span className="text-slate font-normal">(optional)</span></label>
          <textarea placeholder="Tell buyers what makes your store special..."
            rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-[10px] rounded-lg border border-bone text-[13px] text-charcoal outline-none bg-white resize-y" />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => canProceed && onNext()} disabled={!canProceed}>
          Continue <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2 — Seller Type ──────────────────────────────────────────────────────
function Step2({ form, setForm, onNext, onBack }: { form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="max-w-[760px] w-full mx-auto">
      <div className="text-center mb-9">
        <h1 className="text-[28px] font-bold text-carbon mb-2">What kind of seller are you?</h1>
        <p className="text-[14px] text-slate">We'll personalise your dashboard and tools based on your answer.</p>
      </div>
      <div className="grid grid-cols-3 gap-[14px] mb-7">
        {SELLER_TYPES.map((t, idx) => {
          const selKey = `${t.id}-${idx}`;
          const isSelected = form.sellerKey === selKey;
          return (
            <div key={selKey} onClick={() => setForm({ ...form, sellerType: t.id, sellerKey: selKey })}
              className={clsx(
                'bg-white rounded-[14px] p-5 border-2 cursor-pointer transition-all duration-200',
                isSelected ? 'border-brand-orange shadow-[0_0_0_4px_#FBECE4]' : 'border-bone',
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <t.Icon size={32} />
                <div className={clsx(
                  'size-5 rounded-full border-2 flex items-center justify-center shrink-0',
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
function Step3({ form, setForm, onNext, onBack, loading, error }: {
  form: StoreForm; setForm: (f: StoreForm) => void;
  onNext: () => void; onBack: () => void;
  loading: boolean; error: string;
}) {
  const toggle = (id: ProductType) =>
    setForm({ ...form, productTypes: form.productTypes.includes(id) ? form.productTypes.filter(x => x !== id) : [...form.productTypes, id] });

  return (
    <div className="max-w-[700px] w-full mx-auto">
      <div className="text-center mb-9">
        <h1 className="text-[28px] font-bold text-carbon mb-2">What will you sell?</h1>
        <p className="text-[14px] text-slate">Select all that apply — we'll activate the right tools for you.</p>
      </div>
      <div className="grid grid-cols-3 gap-[14px] mb-7">
        {PRODUCT_TYPES.map((t, idx) => {
          const on = form.productTypes.includes(t.id);
          return (
            <div key={idx} onClick={() => toggle(t.id)}
              className={clsx(
                'bg-white rounded-[14px] px-4 py-[18px] border-2 cursor-pointer transition-all duration-200 relative',
                on ? 'border-brand-orange shadow-[0_0_0_4px_#FBECE4]' : 'border-bone',
              )}
            >
              {on && (
                <div className="absolute top-[10px] right-[10px] size-5 rounded-full bg-brand-orange flex items-center justify-center">
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
              {form.productTypes.includes('digital_downloads') && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Digital Delivery</span>}
              {form.productTypes.includes('in_person_pos')     && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">POS Register</span>}
              {form.productTypes.includes('services')          && <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Bookings</span>}
              <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">AI Studio</span>
              <span className="bg-success-bg text-success text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px]">Marketplace</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error-bg rounded-lg px-[14px] py-[10px] mb-4 flex items-center gap-2">
          <AlertTriangle size={14} className="text-error shrink-0" />
          <span className="text-[13px] text-error">{error}</span>
        </div>
      )}

      <div className="flex gap-[10px]">
        <Button variant="ghost" size="md" onClick={onBack} className="shrink-0" disabled={loading}>
          <ArrowLeft size={14} className="inline align-middle mr-1" /> Back
        </Button>
        <Button variant="primary" size="lg" className="flex-1 justify-center"
          onClick={() => form.productTypes.length > 0 && onNext()}
          disabled={form.productTypes.length === 0 || loading}>
          {loading
            ? <span className="flex items-center gap-2 justify-center"><Loader size={14} /> Creating your store...</span>
            : form.productTypes.length > 0
              ? <span>Create Store <ArrowRight size={14} className="inline align-middle ml-1" /></span>
              : 'Select at least one'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — Go Live ──────────────────────────────────────────────────────────
function Step4({ store }: { store: StoreData | null }) {
  const navigate = useNavigate();

  const sellerLabel   = SELLER_TYPES.find(t => t.id === store?.sellerType)?.title ?? store?.sellerType ?? '—';
  const productLabels = (store?.productTypes ?? []).map(p => PRODUCT_TYPES.find(t => t.id === p)?.title ?? p).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const toolLabels    = (store?.enabledTools ?? []).map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');

  return (
    <div className="max-w-[580px] w-full mx-auto">
      <div className="bg-white rounded-2xl border border-bone w-full text-center px-10 py-12">
        <h1 className="text-[30px] font-bold text-carbon mb-[10px]">Your store is ready!</h1>
        <p className="text-[14px] text-slate leading-[1.7] mb-8 max-w-[400px] mx-auto">
          Welcome to Solvexo. Your seller dashboard is set up and your tools are activated.
        </p>

        <div className="bg-cream rounded-[14px] p-5 mb-7 text-left">
          <p className="text-[12px] font-semibold text-carbon mb-[14px]">Your Solvexo Setup</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[10px]">
            {[
              { Icon: Store,      label: 'Store',        value: store?.name ?? '—' },
              { Icon: Globe,      label: 'Store URL',    value: store?.slug ? `${store.slug}.solvexo.store` : '—' },
              { Icon: User,       label: 'Seller type',  value: sellerLabel },
              { Icon: Package,    label: 'Category',     value: store?.categoryId ?? '—' },
              { Icon: Download,   label: 'Products',     value: productLabels || '—' },
              { Icon: CreditCard, label: 'Plan',         value: store?.plan ? `${store.plan.charAt(0).toUpperCase() + store.plan.slice(1)} — Free` : 'Starter — Free' },
              { Icon: Sparkles,   label: 'AI Credits',   value: store?.aiCredits != null ? `${store.aiCredits} free credits included` : '—' },
              { Icon: Wrench,     label: 'Active Tools', value: toolLabels || '—', fullWidth: true },
            ].map(({ Icon, label, value, fullWidth }) => (
              <div key={label} className={clsx('flex items-center gap-[10px]', fullWidth && 'col-span-2')}>
                <Icon size={16} className="w-6 text-slate shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate">{label}</p>
                  <p className="text-[12px] font-semibold text-carbon">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] font-semibold text-carbon mb-[14px]">Recommended next steps</p>
        <div className="grid grid-cols-3 gap-[10px] mb-7">
          {[
            { Icon: Plus,         label: 'Add your first product', path: '/seller/products/add' },
            { Icon: Wrench,       label: 'Customise your store',   path: '/seller/store' },
            { Icon: ShoppingCart, label: 'Browse the marketplace', path: '/marketplace' },
          ].map(({ Icon, label, path }) => (
            <div key={label} onClick={() => navigate(path, { replace: true })}
              className="px-3 py-[14px] rounded-xl border-[1.5px] border-bone bg-white text-center cursor-pointer transition-[border-color] duration-200 hover:border-brand-orange"
            >
              <Icon size={24} className="block mx-auto mb-[6px] text-charcoal" />
              <p className="text-[12px] font-medium text-charcoal">{label}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/seller/dashboard', { replace: true })}>
          Go to My Dashboard <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate    = useNavigate();
  usePageTitle('Onboarding');
  const createStore = useCreateStore();
  const [step, setStep]             = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [form, setForm] = useState<StoreForm>({
    storeName: '', categoryId: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [],
  });

  const next   = () => setStep(s => { const n = Math.min(s + 1, 4); setMaxReached(m => Math.max(m, n)); return n; });
  const back   = () => setStep(s => Math.max(s - 1, 1));
  const jumpTo = (target: number) => setStep(target);

  const handleStep3Next = async () => {
    if (!form.sellerType || form.productTypes.length === 0) return;
    const result = await createStore.execute({
      name:         form.storeName,
      categoryId:   form.categoryId,
      description:  form.description,
      sellerType:   form.sellerType as SellerType,
      productTypes: [...new Set(form.productTypes)],
    });
    if (result) {
      setMaxReached(4);
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <PageHeader onSignIn={() => navigate('/login')} />

      <div className="bg-white border-b border-bone px-10 py-3">
        <div className="max-w-[500px] mx-auto">
          <StepProgress current={step} maxReached={maxReached} onStepClick={jumpTo} />
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 pt-8 pb-[60px]">
        {step === 1 && <Step1 form={form} setForm={setForm} onNext={next} />}
        {step === 2 && <Step2 form={form} setForm={setForm} onNext={next} onBack={back} />}
        {step === 3 && (
          <Step3
            form={form} setForm={setForm}
            onNext={handleStep3Next} onBack={back}
            loading={createStore.loading} error={createStore.error}
          />
        )}
        {step === 4 && <Step4 store={createStore.store} />}
      </div>
    </div>
  );
}
